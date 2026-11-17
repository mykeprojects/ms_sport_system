import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  BetNotificationPayload,
  INotificationsService,
  NOTIFICATIONS_SERVICE,
} from './notifications.types';

/**
 * HTTP adapter for the external notifications microservice (Flask):
 *   POST {MS_NOTIFICATIONS_URL}{MS_NOTIFICATIONS_PATH}
 *   { "para": <email>, "asunto": <subject>, "contenido": <text> }
 *
 * Delivery is best effort: a failure is logged but never rolls back a bet.
 */
@Injectable()
export class HttpNotificationsClient implements INotificationsService {
  private readonly logger = new Logger(HttpNotificationsClient.name);

  constructor(private readonly configService: ConfigService) {}

  async notifyBetRegistered(payload: BetNotificationPayload): Promise<void> {
    await this.send(payload);
  }

  async notifyBetSettled(payload: BetNotificationPayload): Promise<void> {
    await this.send(payload);
  }

  private async send(payload: BetNotificationPayload): Promise<void> {
    const baseUrl = this.configService.get<string>('MS_NOTIFICATIONS_URL');
    if (!baseUrl) {
      this.logger.warn('MS_NOTIFICATIONS_URL is not configured; skipping notification.');
      return;
    }
    if (!payload.fanEmail) {
      this.logger.warn(
        `Notification ${payload.type} for bet ${payload.betId} skipped: the fan has no email.`,
      );
      return;
    }

    const path = this.configService.get<string>('MS_NOTIFICATIONS_PATH') ?? '/notificar';
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const body = {
      para: payload.fanEmail,
      asunto: this.buildSubject(payload),
      contenido: this.buildContent(payload),
    };

    try {
      await axios.post(url, body, { timeout: 15000 });
    } catch (error) {
      this.logger.warn(
        `Notification ${payload.type} for bet ${payload.betId} could not be delivered to ${url}: ${
          axios.isAxiosError(error)
            ? error.response?.status ?? error.code ?? 'no response'
            : 'unexpected error'
        }`,
      );
    }
  }

  private buildSubject(payload: BetNotificationPayload): string {
    return payload.type === 'BET_REGISTERED'
      ? `Bet registered #${payload.betId}`
      : `Bet settled #${payload.betId}`;
  }

  private buildContent(payload: BetNotificationPayload): string {
    const lines = [
      payload.type === 'BET_REGISTERED'
        ? 'Your bet has been registered.'
        : 'Your bet has been settled.',
      `Bet #${payload.betId} | Match #${payload.matchId}`,
      `Selection: ${payload.selection}`,
      `Stake: ${payload.stakeAmount} | Odd: ${payload.lockedOdd}`,
      `Status: ${payload.status}`,
    ];
    if (payload.settledAmount != null) {
      lines.push(`Settled amount: ${payload.settledAmount}`);
    }
    return lines.join('\n');
  }
}

/** Provider helper so modules can bind the port without leaking the class. */
export const notificationsProvider = {
  provide: NOTIFICATIONS_SERVICE,
  useClass: HttpNotificationsClient,
};
