export const TOURNAMENT_STATUSES = [
  'DRAFT',
  'REGISTRATION_OPEN',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
] as const;

export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];
