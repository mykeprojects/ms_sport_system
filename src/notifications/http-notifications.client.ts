import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  BetNotificationPayload,
  INotificationsService,
  MatchNotificationDispatch,
  MatchNotificationPayload,
  NOTIFICATIONS_SERVICE,
} from './notifications.types';

/**
 * HTTP adapter for the external notifications microservice (Flask):
 *   POST {MS_NOTIFICATIONS_URL}{MS_NOTIFICATIONS_PATH}
 *   { "para": <email>, "asunto": <subject>, "contenido": <text>, "idempotency_key"?: <key> }
 *
 * Delivery is best effort: failures are logged and never roll back business operations.
 * For idempotent match notifications, `accepted` is true only when the service confirms
 * the request was processed/sent (or already processed) for the provided key.
 */
@Injectable()
export class HttpNotificationsClient implements INotificationsService {
  private readonly logger = new Logger(HttpNotificationsClient.name);

  constructor(private readonly configService: ConfigService) {}

  async notifyBetRegistered(payload: BetNotificationPayload): Promise<void> {
    await this.sendBet(payload);
  }

  async notifyBetSettled(payload: BetNotificationPayload): Promise<void> {
    await this.sendBet(payload);
  }

  async notifyMatch(payload: MatchNotificationPayload): Promise<MatchNotificationDispatch> {
    return this.sendMatchEmail(
      payload.fanEmail,
      this.buildMatchSubject(payload),
      this.buildMatchContent(payload),
      `match ${payload.matchId} (${payload.type})`,
      payload.idempotencyKey,
    );
  }

  private async sendBet(payload: BetNotificationPayload): Promise<void> {
    if (!payload.fanEmail) {
      this.logger.warn(
        `Notification ${payload.type} for bet ${payload.betId} skipped: the fan has no email.`,
      );
      return;
    }
    await this.sendPlainEmail(
      payload.fanEmail,
      this.buildBetSubject(payload),
      this.buildBetContent(payload),
      `bet ${payload.betId} (${payload.type})`,
    );
  }

  private async sendPlainEmail(
    recipient: string,
    subject: string,
    content: string,
    label: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('MS_NOTIFICATIONS_URL');
    if (!baseUrl) {
      this.logger.warn('MS_NOTIFICATIONS_URL is not configured; skipping notification.');
      return;
    }

    const path = this.configService.get<string>('MS_NOTIFICATIONS_PATH') ?? '/notificar';
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const body = { para: recipient, asunto: subject, contenido: content };

    try {
      await axios.post(url, body, { timeout: 15000 });
    } catch (error) {
      this.logger.warn(
        `Notification ${label} could not be delivered to ${url}: ${this.describeError(error)}`,
      );
    }
  }

  private async sendMatchEmail(
    recipient: string,
    subject: string,
    content: string,
    label: string,
    idempotencyKey?: string,
  ): Promise<MatchNotificationDispatch> {
    if (!recipient) {
      this.logger.warn(`Notification ${label} skipped: missing recipient email.`);
      return { accepted: false, state: 'skipped' };
    }

    const baseUrl = this.configService.get<string>('MS_NOTIFICATIONS_URL');
    if (!baseUrl) {
      this.logger.warn('MS_NOTIFICATIONS_URL is not configured; skipping notification.');
      return { accepted: false, state: 'skipped' };
    }

    const path = this.configService.get<string>('MS_NOTIFICATIONS_PATH') ?? '/notificar';
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const body: Record<string, string> = { para: recipient, asunto: subject, contenido: content };
    if (idempotencyKey) body.idempotency_key = idempotencyKey;

    try {
      const response = await axios.post(url, body, {
        timeout: 15000,
        validateStatus: () => true,
      });
      const data = (response.data ?? {}) as Record<string, unknown>;
      const state = typeof data.estado === 'string' ? data.estado : undefined;
      const procesada = data.procesada === true;
      const duplicate = data.duplicado === true;
      const messageId = typeof data.id === 'string' ? data.id : null;

      if (response.status >= 200 && response.status < 300) {
        const accepted = idempotencyKey ? procesada || state === 'sent' : true;
        return {
          accepted,
          state: accepted ? 'sent' : state === 'failed' ? 'failed' : 'sent',
          duplicate,
          messageId,
        };
      }

      if (response.status === 409 || state === 'processing') {
        return { accepted: false, state: 'processing', duplicate: true, messageId };
      }

      this.logger.warn(
        `Notification ${label} was not accepted by ${url}: ${response.status}`,
      );
      return { accepted: false, state: 'failed', duplicate, messageId };
    } catch (error) {
      this.logger.warn(
        `Notification ${label} could not be delivered to ${url}: ${this.describeError(error)}`,
      );
      return { accepted: false, state: 'failed' };
    }
  }

  private describeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return String(error.response?.status ?? error.code ?? 'no response');
    }
    return 'unexpected error';
  }

  private buildBetSubject(payload: BetNotificationPayload): string {
    if (payload.type === 'BET_REGISTERED') {
      return `Apuesta registrada #${payload.betId}`;
    }
    if (payload.status === 'WON') {
      return `Apuesta ganada #${payload.betId}`;
    }
    if (payload.status === 'LOST') {
      return `Apuesta perdida #${payload.betId}`;
    }
    if (payload.status === 'CANCELLED') {
      return `Apuesta cancelada #${payload.betId}`;
    }
    if (payload.status === 'VOIDED') {
      return `Apuesta anulada #${payload.betId}`;
    }
    return `Resultado de apuesta #${payload.betId}`;
  }

  private buildBetContent(payload: BetNotificationPayload): string {
    const lines = [
      payload.type === 'BET_REGISTERED'
        ? 'Tu apuesta fue registrada.'
        : payload.status === 'WON'
          ? '¡Ganaste la apuesta!'
          : payload.status === 'LOST'
            ? 'La apuesta quedó perdida.'
            : payload.status === 'CANCELLED'
              ? 'La apuesta quedó cancelada.'
              : 'La apuesta quedó anulada.',
      `Apuesta #${payload.betId} | Partido #${payload.matchId}`,
      `Selección: ${this.selectionLabel(payload.selection)}`,
      `Valor apostado: ${payload.stakeAmount} | Cuota: ${payload.lockedOdd}`,
      `Estado: ${this.betStatusLabel(payload.status)}`,
    ];
    if (payload.settledAmount != null) {
      lines.push(`Valor recibido: ${payload.settledAmount}`);
    }
    return lines.join('\n');
  }

  private selectionLabel(selection: string): string {
    if (selection === 'HOME') return 'Equipo local';
    if (selection === 'AWAY') return 'Equipo visitante';
    if (selection === 'DRAW') return 'Empate';
    return selection;
  }

  private betStatusLabel(status: string): string {
    if (status === 'WON') return 'Ganada';
    if (status === 'LOST') return 'Perdida';
    if (status === 'CANCELLED') return 'Cancelada';
    if (status === 'VOIDED') return 'Anulada';
    return 'Registrada';
  }

  private buildMatchSubject(payload: MatchNotificationPayload): string {
    if (payload.type === 'MATCH_CANCELLED') {
      return `Partido cancelado: ${payload.homeTeam} vs ${payload.awayTeam}`;
    }
    if (payload.type === 'MATCH_UPDATED') {
      return `Partido reprogramado: ${payload.homeTeam} vs ${payload.awayTeam}`;
    }
    if (payload.type === 'MATCH_REMINDER') {
      return `Recordatorio: ${payload.homeTeam} vs ${payload.awayTeam}`;
    }
    return `Nuevo partido: ${payload.homeTeam} vs ${payload.awayTeam}`;
  }

  private buildMatchContent(payload: MatchNotificationPayload): string {
    const intro =
      payload.type === 'MATCH_CANCELLED'
        ? 'Un partido de tu interés fue cancelado.'
        : payload.type === 'MATCH_UPDATED'
          ? 'Un partido de tu interés cambió de programación.'
          : payload.type === 'MATCH_REMINDER'
            ? 'Se acerca un partido de tu interés.'
            : 'Se programó un nuevo partido relacionado con tus partidos anteriores.';

    const lines = [
      intro,
      `Partido: ${payload.homeTeam} vs ${payload.awayTeam}`,
      `Fecha y hora: ${this.formatDate(payload.startsAt)}`,
    ];
    if (payload.venue) {
      lines.push(`Lugar: ${payload.venue}`);
    }
    lines.push(`Partido #${payload.matchId}`);
    return lines.join('\n');
  }

  private formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  }
}

/** Provider helper so modules can bind the port without leaking the class. */
export const notificationsProvider = {
  provide: NOTIFICATIONS_SERVICE,
  useClass: HttpNotificationsClient,
};
