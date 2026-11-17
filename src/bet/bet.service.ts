import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { FanContext } from '../fan/identity/fan-identity.service';
import { FanService } from '../fan/fan.service';
import { Fan } from '../fan/entities/fan.entity';
import { Match } from '../match/entities/match.entity';
import { MatchService } from '../match/match.service';
import { isSettledMatchStatus } from '../match/match.rules';
import type { BetNotificationPayload, INotificationsService } from '../notifications/notifications.types';
import { NOTIFICATIONS_SERVICE } from '../notifications/notifications.types';
import { CreateBetDto } from './dto/create-bet.dto';
import { Bet } from './entities/bet.entity';
import { BetMapper } from './mappers/bet.mapper';
import { BetRulesConfig } from './bet-rules.config';
import {
  cancellationRejection,
  canCancelBet,
  isWithinStakeLimits,
  resolveBetStatus,
  settleAmount,
} from './bet.rules';

@Injectable()
export class BetService {
  private readonly logger = new Logger(BetService.name);

  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    private readonly dataSource: DataSource,
    private readonly fanService: FanService,
    private readonly matchService: MatchService,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notifications: INotificationsService,
    private readonly rules: BetRulesConfig,
    private readonly mapper: BetMapper,
  ) {}

  /**
   * Places a bet for the authenticated fan on an open match using one of the
   * fan's own payment methods. The odd is frozen at this exact moment.
   */
  async create(dto: CreateBetDto, context: FanContext) {
    const fan = await this.fanService.ensureRegistered(context);
    const match = await this.matchService.getEntity(dto.matchId);
    this.assertMatchOpen(match);

    // Ownership, activity and base payment method are validated by FanService (SRP).
    await this.fanService.getOwnedActivePaymentMethod(fan.id, dto.fanPaymentMethodId);

    if (!isWithinStakeLimits(dto.stakeAmount, this.rules.minStakeAmount, this.rules.maxStakeAmount)) {
      throw new BadRequestException(
        `The stake must be between ${this.rules.minStakeAmount} and ${this.rules.maxStakeAmount}.`,
      );
    }

    const lockedOdd = this.matchService.getOdd(match, dto.selection);
    const bet = await this.betRepository.save(
      this.betRepository.create({
        matchId: match.id,
        fanId: fan.id,
        fanPaymentMethodId: dto.fanPaymentMethodId,
        selection: dto.selection,
        stakeAmount: dto.stakeAmount,
        lockedOdd,
        status: 'REGISTERED',
        settledAmount: 0,
        settled: false,
        settledAt: null,
      }),
    );

    await this.notifyQuietly(
      this.buildNotification('BET_REGISTERED', fan.externalUserId, context.email, bet),
      `bet ${bet.id}`,
    );
    return this.mapper.toResponse(bet);
  }

  /** All bets placed by the current fan with their match summary. */
  async listMine(context: FanContext) {
    const fan = await this.fanService.ensureRegistered(context);
    const bets = await this.betRepository.find({
      where: { fanId: fan.id },
      order: { id: 'DESC' },
    });
    const matches = await this.loadMatches(bets.map((bet) => bet.matchId));
    return bets.map((bet) => this.mapper.toResponseWithMatch(bet, matches.get(bet.matchId) ?? null));
  }

  /** All bets placed on a match (sports administrator view). */
  async listByMatch(matchId: number) {
    const match = await this.matchService.getEntity(matchId);
    const bets = await this.betRepository.find({
      where: { matchId: match.id },
      order: { id: 'ASC' },
    });
    const fans = await this.loadFans(bets.map((bet) => bet.fanId));
    return bets.map((bet) =>
      this.mapper.toResponseWithFan(bet, fans.get(bet.fanId)),
    );
  }

  /**
   * Cancels a registered bet while the configured windows allow it.
   * Never possible after the match started (HU) and never twice.
   */
  async cancel(id: number, context: FanContext) {
    const fan = await this.fanService.ensureRegistered(context);
    const bet = await this.betRepository.findOne({ where: { id } });
    if (!bet) throw new NotFoundException(`Bet #${id} was not found.`);
    if (bet.fanId !== fan.id) {
      throw new ForbiddenException('That bet does not belong to the current fan.');
    }
    if (bet.status !== 'REGISTERED' || bet.settled) {
      throw new ConflictException('Only registered bets that are not settled can be cancelled.');
    }

    const match = await this.matchService.getEntity(bet.matchId);
    const now = new Date();
    if (!canCancelBet(match, now, this.rules.cancellationRules)) {
      throw new ConflictException(cancellationRejection(match, now));
    }

    bet.status = 'CANCELLED';
    bet.settledAmount = bet.stakeAmount;
    bet.settled = true;
    bet.settledAt = now;
    const saved = await this.betRepository.save(bet);
    return this.mapper.toResponse(saved);
  }

  /**
   * Settles every pending bet of a finished (or cancelled) match exactly once.
   * Runs in a transaction and only picks bets with `settled = false`, so
   * calling it repeatedly never pays twice (HU: no double settlement).
   */
  async settle(matchId: number) {
    const now = new Date();
    const result = await this.dataSource.transaction(async (manager) => {
      const match = await manager.findOne(Match, { where: { id: matchId } });
      if (!match) throw new NotFoundException(`Match #${matchId} was not found.`);
      if (match.status === 'FINISHED' && !match.officialResult) {
        throw new ConflictException('The match does not have an official result yet.');
      }
      if (!isSettledMatchStatus(match.status)) {
        throw new ConflictException('The match has not finished yet.');
      }

      const pending = await manager.find(Bet, {
        where: { matchId: match.id, settled: false, status: 'REGISTERED' },
      });

      const fanIds = [...new Set(pending.map((bet) => bet.fanId))];
      const fans = fanIds.length
        ? await manager.find(Fan, { where: { id: In(fanIds) } })
        : [];
      const fanById = new Map(fans.map((fan) => [fan.id, fan]));

      let won = 0;
      let lost = 0;
      let voided = 0;
      let totalPayout = 0;
      const payloads: BetNotificationPayload[] = [];

      for (const bet of pending) {
        const status = resolveBetStatus(bet.selection, match.officialResult, match.status);
        const amount = settleAmount(status, bet.stakeAmount, bet.lockedOdd);

        bet.status = status;
        bet.settledAmount = amount;
        bet.settled = true;
        bet.settledAt = now;

        if (status === 'WON') won += 1;
        else if (status === 'LOST') lost += 1;
        else voided += 1;
        totalPayout += amount;

        const fan = fanById.get(bet.fanId);
        payloads.push(
          this.buildNotification(
            'BET_SETTLED',
            fan?.externalUserId ?? 0,
            fan?.email ?? undefined,
            bet,
          ),
        );
      }

      if (pending.length) await manager.save(Bet, pending);

      return {
        message: 'The match bets were settled successfully.',
        matchId: match.id,
        processed: pending.length,
        won,
        lost,
        voided,
        totalPayout: Math.round(totalPayout * 100) / 100,
        payloads,
      };
    });

    // Notifications are sent after the commit so external failures never
    // compromise the consistency of the settlement.
    for (const payload of result.payloads) {
      await this.notifyQuietly(payload, `bet ${payload.betId}`);
    }
    const { payloads: _payloads, ...summary } = result;
    return summary;
  }

  private assertMatchOpen(match: Match): void {
    const now = new Date();
    if (match.status === 'CANCELLED') {
      throw new ConflictException('This match was cancelled; bets are not accepted.');
    }
    if (match.status === 'FINISHED') {
      throw new ConflictException('This match already finished; bets are not accepted.');
    }
    if (!match.bettingEnabled) {
      throw new ConflictException('Betting is disabled for this match.');
    }
    if (now >= match.startsAt) {
      throw new ConflictException('Betting is closed: the match already started.');
    }
    if (now >= match.bettingClosesAt || match.status === 'BETTING_CLOSED') {
      throw new ConflictException('Betting is closed for this match.');
    }
  }

  private buildNotification(
    type: BetNotificationPayload['type'],
    fanExternalUserId: number,
    fanEmail: string | undefined,
    bet: Bet,
  ): BetNotificationPayload {
    return {
      type,
      fanExternalUserId,
      fanEmail,
      betId: bet.id,
      matchId: bet.matchId,
      status: bet.status,
      selection: bet.selection,
      stakeAmount: bet.stakeAmount,
      lockedOdd: bet.lockedOdd,
      settledAmount: type === 'BET_SETTLED' ? bet.settledAmount : undefined,
      occurredAt: new Date().toISOString(),
    };
  }

  /** The external channel is best effort: never fails the business operation. */
  private async notifyQuietly(payload: BetNotificationPayload, target: string): Promise<void> {
    try {
      if (payload.type === 'BET_REGISTERED') {
        await this.notifications.notifyBetRegistered(payload);
      } else {
        await this.notifications.notifyBetSettled(payload);
      }
    } catch (error) {
      this.logger.warn(
        `Notification for ${target} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private async loadMatches(ids: number[]): Promise<Map<number, Match>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const matches = await this.matchService.listEntities(unique);
    return new Map(matches.map((match) => [match.id, match]));
  }

  private async loadFans(ids: number[]): Promise<Map<number, Fan>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const fans = await this.dataSource.manager.find(Fan, { where: { id: In(unique) } });
    return new Map(fans.map((fan) => [fan.id, fan]));
  }
}
