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
 * Port consumed by BetService. The notifications microservice is an external
 * dependency, so business logic only knows this abstraction (Dependency Inversion).
 */
export interface INotificationsService {
  notifyBetRegistered(payload: BetNotificationPayload): Promise<void>;
  notifyBetSettled(payload: BetNotificationPayload): Promise<void>;
}
