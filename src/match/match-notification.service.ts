import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { FanFollowService } from '../fan/follow/fan-follow.service';
import { Match } from './entities/match.entity';
import { MatchReminderDelivery } from './entities/match-reminder-delivery.entity';
import { MatchStatus } from './match.constants';
import {
  MatchNotificationDispatch,
  MatchNotificationPayload,
  MatchNotificationType,
  NOTIFICATIONS_SERVICE,
} from '../notifications/notifications.types';
import type { INotificationsService } from '../notifications/notifications.types';

type ReminderRecipient = { fanId: number; externalUserId: number; email: string };

export type ReminderRunSummary = {
  windowDays: number;
  matches: number;
  recipients: number;
  processed: number;
  sent: number;
  duplicates: number;
  processing: number;
  failed: number;
  exhausted: number;
  skipped: number;
};

/**
 * Notifies fans who follow the teams involved in a match.
 * - Create/update/cancel: best-effort, followers deduplicated by user (one per fan even if follows both teams).
 * - Reminders: idempotent end-to-end (stable key + persistent delivery state + notification service dedupe),
 *   with controlled retries/backoff and an in-process overlap guard.
 */
@Injectable()
export class MatchNotificationService {
  private readonly logger = new Logger(MatchNotificationService.name);
  private reminderRunInProgress = false;

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(MatchReminderDelivery)
    private readonly deliveryRepository: Repository<MatchReminderDelivery>,
    private readonly fanFollowService: FanFollowService,
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notifications: INotificationsService,
  ) {}

  notifyCreated(match: Match): Promise<void> {
    return this.notifyFollowersEvent(match, 'MATCH_CREATED');
  }

  notifyUpdated(match: Match): Promise<void> {
    return this.notifyFollowersEvent(match, 'MATCH_UPDATED');
  }

  notifyCancelled(match: Match): Promise<void> {
    return this.notifyFollowersEvent(match, 'MATCH_CANCELLED');
  }

  notifyFinished(match: Match): Promise<void> {
    return this.notifyFollowersEvent(match, 'MATCH_FINISHED');
  }

  async notifyUpcomingReminders(days?: number): Promise<ReminderRunSummary> {
    const windowDays = this.resolveWindowDays(days);
    const summary: ReminderRunSummary = {
      windowDays,
      matches: 0,
      recipients: 0,
      processed: 0,
      sent: 0,
      duplicates: 0,
      processing: 0,
      failed: 0,
      exhausted: 0,
      skipped: 0,
    };

    if (this.reminderRunInProgress) {
      this.logger.warn('A reminder run is already in progress; skipping overlapping execution.');
      return summary;
    }

    this.reminderRunInProgress = true;
    try {
      const now = new Date();
      const until = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
      const matches = await this.matchRepository.find({
        where: {
          startsAt: Between(now, until),
          status: Not(In(['FINISHED', 'CANCELLED'] as MatchStatus[])),
        },
        order: { startsAt: 'ASC' },
      });
      summary.matches = matches.length;

      for (const match of matches) {
        let recipients: ReminderRecipient[] = [];
        try {
          recipients = await this.getUniqueFollowers(match);
        } catch (error) {
          this.logger.warn(
            `Could not resolve followers for match ${match.id}: ${
              error instanceof Error ? error.message : 'unexpected error'
            }`,
          );
          continue;
        }

        for (const recipient of recipients) {
          summary.recipients += 1;
          try {
            const outcome = await this.processReminder(match, recipient, windowDays);
            summary[outcome] += 1;
          } catch (error) {
            summary.failed += 1;
            this.logger.warn(
              `Reminder for match ${match.id} fan ${recipient.externalUserId} failed: ${
                error instanceof Error ? error.message : 'unexpected error'
              }`,
            );
          }
        }
      }
      return summary;
    } finally {
      this.reminderRunInProgress = false;
    }
  }

  private async notifyFollowersEvent(match: Match, type: MatchNotificationType): Promise<void> {
    try {
      const recipients = await this.getUniqueFollowers(match);
      if (recipients.length === 0) return;
      const occurredAt = new Date().toISOString();
      for (const recipient of recipients) {
        const payload = this.buildPayload(match, recipient, type, occurredAt);
        await this.notifications.notifyMatch(payload);
      }
    } catch (error) {
      this.logger.warn(
        `Match ${type} notification for match ${match.id} could not be prepared: ${
          error instanceof Error ? error.message : 'unexpected error'
        }`,
      );
    }
  }

  private async getUniqueFollowers(match: Match): Promise<ReminderRecipient[]> {
    const followers = await this.fanFollowService.getFollowerRecipientsForTeams([
      match.homeTeamId,
      match.awayTeamId,
    ]);
    const unique = new Map<number, ReminderRecipient>();
    for (const follower of followers) {
      if (!unique.has(follower.externalUserId)) {
        unique.set(follower.externalUserId, {
          fanId: follower.fanId,
          externalUserId: follower.externalUserId,
          email: follower.email,
        });
      }
    }
    return [...unique.values()];
  }

  private buildPayload(
    match: Match,
    recipient: { externalUserId: number; email: string },
    type: MatchNotificationType,
    occurredAt: string,
    idempotencyKey?: string,
  ): MatchNotificationPayload {
    return {
      type,
      fanExternalUserId: recipient.externalUserId,
      fanEmail: recipient.email,
      matchId: match.id,
      tournamentId: match.tournamentId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startsAt: match.startsAt.toISOString(),
      venue: match.venue,
      occurredAt,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };
  }

  private reminderKey(matchId: number, fanExternalUserId: number, windowDays: number): string {
    return `match-reminder:${matchId}:${fanExternalUserId}:w${windowDays}`;
  }

  private resolveWindowDays(days?: number): number {
    if (days != null && Number.isFinite(days)) {
      return Math.min(Math.max(Math.trunc(days), 1), 365);
    }
    const raw = this.configService.get<string>('MATCH_REMINDER_DAYS');
    const parsed = raw == null ? NaN : Number(raw);
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(Math.trunc(parsed), 1), 365);
    }
    return 1;
  }

  private retryConfig() {
    const maxAttempts = this.intEnv('MATCH_REMINDER_MAX_ATTEMPTS', 5, 1, 100);
    const baseSeconds = this.intEnv('MATCH_REMINDER_RETRY_BASE_SECONDS', 60, 5, 86400);
    const maxSeconds = this.intEnv('MATCH_REMINDER_RETRY_MAX_SECONDS', 3600, baseSeconds, 604800);
    const staleSeconds = this.intEnv('MATCH_REMINDER_PROCESSING_STALE_SECONDS', 300, 30, 86400);
    return { maxAttempts, baseSeconds, maxSeconds, staleSeconds };
  }

  private intEnv(key: string, fallback: number, min: number, max: number): number {
    const raw = this.configService.get<string>(key);
    if (raw == null || raw === '') return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private backoffSeconds(attemptCount: number, base: number, max: number): number {
    const exp = Math.max(attemptCount - 1, 0);
    const delay = base * Math.pow(2, exp);
    const bounded = Math.min(delay, max);
    const jitter = Math.floor(Math.random() * Math.min(15, Math.max(1, Math.floor(base / 2))));
    return Math.min(Math.floor(bounded) + jitter, max);
  }

  private isDuplicate(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }

  private async getOrCreateDelivery(
    match: Match,
    recipient: ReminderRecipient,
    windowDays: number,
  ): Promise<MatchReminderDelivery> {
    const idempotencyKey = this.reminderKey(match.id, recipient.externalUserId, windowDays);
    let delivery = await this.deliveryRepository.findOne({ where: { idempotencyKey } });
    if (delivery) return delivery;

    const entity = this.deliveryRepository.create({
      idempotencyKey,
      matchId: match.id,
      fanId: recipient.fanId,
      fanExternalUserId: recipient.externalUserId,
      reminderWindow: windowDays,
      status: 'PENDING',
      attemptCount: 0,
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastError: null,
      processedAt: null,
    });
    try {
      delivery = await this.deliveryRepository.save(entity);
    } catch (error) {
      if (!this.isDuplicate(error)) throw error;
      delivery = await this.deliveryRepository.findOne({ where: { idempotencyKey } });
      if (!delivery) throw error;
    }
    return delivery;
  }

  private async processReminder(
    match: Match,
    recipient: ReminderRecipient,
    windowDays: number,
  ): Promise<'processed' | 'sent' | 'duplicates' | 'processing' | 'failed' | 'exhausted' | 'skipped'> {
    const { maxAttempts, baseSeconds, maxSeconds, staleSeconds } = this.retryConfig();
    const now = new Date();
    let delivery = await this.getOrCreateDelivery(match, recipient, windowDays);

    if (delivery.status === 'PROCESSED') return 'processed';
    if (delivery.status === 'EXHAUSTED') return 'exhausted';

    if (delivery.attemptCount >= maxAttempts) {
      delivery.status = 'EXHAUSTED';
      delivery.nextAttemptAt = null;
      await this.deliveryRepository.save(delivery);
      return 'exhausted';
    }

    if (delivery.nextAttemptAt && delivery.nextAttemptAt > now && delivery.status === 'PENDING') {
      return 'skipped';
    }
    if (delivery.status === 'PROCESSING' && delivery.lastAttemptAt) {
      const ageMs = now.getTime() - delivery.lastAttemptAt.getTime();
      if (ageMs < staleSeconds * 1000) {
        return 'processing';
      }
    }

    const claimTime = new Date();
    const claim = await this.deliveryRepository
      .createQueryBuilder()
      .update(MatchReminderDelivery)
      .set({ status: 'PROCESSING', lastAttemptAt: claimTime })
      .where('id = :id', { id: delivery.id })
      .andWhere('status IN (:...statuses)', { statuses: ['PENDING', 'PROCESSING'] })
      .andWhere('(status != :processed AND status != :exhausted)', {
        processed: 'PROCESSED',
        exhausted: 'EXHAUSTED',
      })
      .execute();

    if (!claim.affected) {
      const fresh = await this.deliveryRepository.findOne({ where: { id: delivery.id } });
      if (!fresh) return 'skipped';
      if (fresh.status === 'PROCESSED') return 'processed';
      if (fresh.status === 'EXHAUSTED') return 'exhausted';
      return 'skipped';
    }

    delivery = (await this.deliveryRepository.findOne({ where: { id: delivery.id } })) ?? delivery;

    const payload = this.buildPayload(
      match,
      recipient,
      'MATCH_REMINDER',
      new Date().toISOString(),
      delivery.idempotencyKey,
    );

    let dispatch: MatchNotificationDispatch;
    try {
      dispatch = await this.notifications.notifyMatch(payload);
    } catch (error) {
      dispatch = {
        accepted: false,
        state: 'failed',
      };
      this.logger.warn(
        `Unexpected notification error for match ${match.id} fan ${recipient.externalUserId}: ${
          error instanceof Error ? error.message : 'unexpected error'
        }`,
      );
    }

    if (dispatch.accepted) {
      delivery.status = 'PROCESSED';
      delivery.processedAt = new Date();
      delivery.nextAttemptAt = null;
      delivery.lastError = null;
      await this.deliveryRepository.save(delivery);
      return dispatch.duplicate ? 'duplicates' : 'sent';
    }

    if (dispatch.state === 'processing') {
      delivery.status = 'PENDING';
      delivery.nextAttemptAt = new Date(Date.now() + Math.min(60, baseSeconds) * 1000);
      delivery.lastError = 'processing';
      await this.deliveryRepository.save(delivery);
      return 'processing';
    }

    const attempts = delivery.attemptCount + 1;
    delivery.attemptCount = attempts;
    delivery.lastError = (dispatch.state ?? 'failed').slice(0, 500);
    if (attempts >= maxAttempts) {
      delivery.status = 'EXHAUSTED';
      delivery.nextAttemptAt = null;
    } else {
      delivery.status = 'PENDING';
      delivery.nextAttemptAt = new Date(Date.now() + this.backoffSeconds(attempts, baseSeconds, maxSeconds) * 1000);
    }
    await this.deliveryRepository.save(delivery);
    return attempts >= maxAttempts ? 'exhausted' : 'failed';
  }
}
