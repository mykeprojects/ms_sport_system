import { BETTABLE_STATUSES } from './match.constants';
import type { MatchStatus } from './match.constants';

/**
 * Pure rules for the match domain. Keeping them free of Nest/TypeORM makes
 * them trivially testable and reusable by both MatchService and BetService.
 */
export function isOpenForBetting(
  match: {
    status: MatchStatus;
    bettingEnabled: boolean;
    startsAt: Date;
    bettingClosesAt: Date;
  },
  now: Date,
): boolean {
  if (!match.bettingEnabled) return false;
  if (!BETTABLE_STATUSES.includes(match.status)) return false;
  return now < match.startsAt && now < match.bettingClosesAt;
}

export function isStarted(match: { startsAt: Date }, now: Date): boolean {
  return now >= match.startsAt;
}

export function isClosedForBetting(match: { bettingClosesAt: Date }, now: Date): boolean {
  return now >= match.bettingClosesAt;
}

export function isSettledMatchStatus(status: MatchStatus): boolean {
  return status === 'FINISHED' || status === 'CANCELLED';
}
