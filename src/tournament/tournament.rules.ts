import { TournamentStatus } from './tournament.constants';

export function normalizeTournamentName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function tournamentNameKey(value: string): string {
  return normalizeTournamentName(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

export function validateTournamentDates(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return 'The tournament start and end dates are required.';
  if (endDate < startDate) return 'The end date must be equal to or later than the start date.';
  return null;
}

export function canDeleteTournament(status: TournamentStatus): boolean {
  return status !== 'IN_PROGRESS';
}
