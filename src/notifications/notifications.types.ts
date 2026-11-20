export const NOTIFICATIONS_SERVICE = 'NOTIFICATIONS_SERVICE';

export type BetNotificationType = 'BET_REGISTERED' | 'BET_SETTLED';

/** Payload sent to the notifications microservice. */
export interface BetNotificationPayload {
  type: BetNotificationType;
  fanExternalUserId: number;
  fanEmail?: string;
  betId: number;
  matchId: number;
  status: string;
  selection: string;
  stakeAmount: number;
  lockedOdd: number;
  settledAmount?: number;
  occurredAt: string;
}

/**
 * Neutral match notifications introduced by HU-GC-06. They reuse the same
 * notifications microservice without replacing the betting contract.
 */
export type MatchNotificationType =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_CANCELLED'
  | 'MATCH_REMINDER';

export interface MatchNotificationPayload {
  type: MatchNotificationType;
  fanExternalUserId: number;
  fanEmail: string;
  matchId: number;
  tournamentId: number | null;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  venue: string | null;
  occurredAt: string;
  /** Stable idempotency key for end-to-end deduplication (e.g. reminders). */
  idempotencyKey?: string;
}

export type MatchNotificationDispatch = {
  /** True only when the notification service confirmed it was processed/sent (or already processed for the key). */
  accepted: boolean;
  state?: 'sent' | 'processing' | 'failed' | 'skipped';
  duplicate?: boolean;
  messageId?: string | null;
};

/**
 * Port consumed by the sport services. The notifications microservice is an
 * external dependency, so business logic only knows this abstraction.
 */
export interface INotificationsService {
  notifyBetRegistered(payload: BetNotificationPayload): Promise<void>;
  notifyBetSettled(payload: BetNotificationPayload): Promise<void>;
  notifyMatch(payload: MatchNotificationPayload): Promise<MatchNotificationDispatch>;
}
