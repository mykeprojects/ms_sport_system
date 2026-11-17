export const BET_STATUSES = ['REGISTERED', 'WON', 'LOST', 'VOIDED', 'CANCELLED'] as const;
export type BetStatus = (typeof BET_STATUSES)[number];

export const BET_SELECTIONS = ['HOME', 'AWAY', 'DRAW'] as const;
export type BetSelection = (typeof BET_SELECTIONS)[number];
