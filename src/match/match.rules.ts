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

/** A finished or cancelled match is immutable for scheduling purposes. */
export function canModifyMatch(status: MatchStatus): boolean {
  return status !== 'FINISHED' && status !== 'CANCELLED';
}

/** Extracts the calendar date (`YYYY-MM-DD`) used by tournament and phase ranges. */
export function dateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    const direct = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    return dateOnly(new Date(value));
  }
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${value.getUTCFullYear()}-${month}-${day}`;
}

/** Calendar comparison against an inclusive `YYYY-MM-DD` range. */
export function isDateWithinRange(
  value: string | Date,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const date = dateOnly(value);
  return date >= rangeStart && date <= rangeEnd;
}

export function normalizeRoundLabel(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function sameTeamPair(
  firstHomeId: number,
  firstAwayId: number,
  secondHomeId: number,
  secondAwayId: number,
): boolean {
  return (
    (firstHomeId === secondHomeId && firstAwayId === secondAwayId) ||
    (firstHomeId === secondAwayId && firstAwayId === secondHomeId)
  );
}

export interface MatchSlot {
  id?: number;
  tournamentId: number | null;
  phaseId: number | null;
  roundLabel: string | null;
  homeTeamId: number;
  awayTeamId: number;
  startsAt: Date;
}

/**
 * A scheduled match is duplicated when it repeats the same tournament/phase,
 * round and team pair. Matches without tournament fall back to the exact
 * start instant so legacy fixtures remain compatible.
 */
export function isDuplicateMatchSlot(
  candidate: MatchSlot,
  existing: MatchSlot,
): boolean {
  if (candidate.id != null && existing.id === candidate.id) return false;
  if (!sameTeamPair(candidate.homeTeamId, candidate.awayTeamId, existing.homeTeamId, existing.awayTeamId)) {
    return false;
  }
  if (normalizeRoundLabel(candidate.roundLabel) !== normalizeRoundLabel(existing.roundLabel)) {
    return false;
  }

  if (candidate.phaseId != null || existing.phaseId != null) {
    return candidate.phaseId === existing.phaseId;
  }
  if (candidate.tournamentId != null || existing.tournamentId != null) {
    return (
      candidate.tournamentId === existing.tournamentId &&
      dateOnly(candidate.startsAt) === dateOnly(existing.startsAt)
    );
  }
  return candidate.startsAt.getTime() === existing.startsAt.getTime();
}
