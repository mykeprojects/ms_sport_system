import type { OfficialResult } from '../match/match.constants';
import type { MatchStatus } from '../match/match.constants';
import type { BetSelection, BetStatus } from './bet.constants';

export interface CancellationRules {
  allowCancelBeforeStart: boolean;
  allowCancelBeforeBettingClose: boolean;
}

/** Round money values to two decimals (MySQL DECIMAL(12,2)). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compares the frozen selection against the official result.
 * A cancelled match or a VOID result invalidates the bet (stake returned).
 */
export function resolveBetStatus(
  selection: BetSelection,
  officialResult: OfficialResult | null,
  matchStatus: MatchStatus,
): Extract<BetStatus, 'WON' | 'LOST' | 'VOIDED'> {
  if (matchStatus === 'CANCELLED' || officialResult == null || officialResult === 'VOID') {
    return 'VOIDED';
  }
  return selection === officialResult ? 'WON' : 'LOST';
}

/** HU: won -> stake x frozen odd; lost -> 0; voided -> original stake. */
export function settleAmount(status: BetStatus, stakeAmount: number, lockedOdd: number): number {
  if (status === 'WON') return roundMoney(stakeAmount * lockedOdd);
  if (status === 'VOIDED') return roundMoney(stakeAmount);
  return 0;
}

/** Initial configurable conditions for the stake value (see BetRulesConfig). */
export function isWithinStakeLimits(amount: number, min: number, max: number): boolean {
  return Number.isFinite(amount) && amount >= min && amount <= max;
}

/**
 * HU: a registered bet can never be modified once the match started.
 * Before the start, cancellation depends on the configurable windows.
 */
export function canCancelBet(
  match: { status: MatchStatus; startsAt: Date; bettingClosesAt: Date },
  now: Date,
  rules: CancellationRules,
): boolean {
  if (match.status === 'FINISHED' || match.status === 'CANCELLED') return false;
  if (now >= match.startsAt) return false;
  if (now >= match.bettingClosesAt) return rules.allowCancelBeforeStart;
  return rules.allowCancelBeforeBettingClose;
}

/** Human readable reason when cancellation is not allowed (mirrors canCancelBet). */
export function cancellationRejection(
  match: { status: MatchStatus; startsAt: Date; bettingClosesAt: Date },
  now: Date,
): string {
  if (match.status === 'FINISHED') return 'This match already finished.';
  if (match.status === 'CANCELLED') return 'This match was cancelled.';
  if (now >= match.startsAt) return 'A bet cannot be modified after the match started.';
  return 'The cancellation window for this match is closed.';
}
