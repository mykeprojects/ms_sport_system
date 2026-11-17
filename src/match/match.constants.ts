export const MATCH_STATUSES = [
  'SCHEDULED',
  'BETTING_OPEN',
  'BETTING_CLOSED',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const OFFICIAL_RESULTS = ['HOME', 'AWAY', 'DRAW', 'VOID'] as const;
export type OfficialResult = (typeof OFFICIAL_RESULTS)[number];

/** Statuses in which a match can still accept bets (time window is checked separately). */
export const BETTABLE_STATUSES: readonly MatchStatus[] = ['SCHEDULED', 'BETTING_OPEN'];
