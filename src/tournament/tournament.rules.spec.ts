import {
  normalizeTournamentName,
  tournamentNameKey,
  validateTournamentDates,
  canDeleteTournament,
} from './tournament.rules';

describe('tournament rules', () => {
  it('normalizes names and produces a stable name key', () => {
    expect(normalizeTournamentName('  Copa   Universitaria  ')).toBe('Copa Universitaria');
    expect(tournamentNameKey('Copa Águila')).toBe('copa aguila');
  });

  it('validates chronological dates', () => {
    expect(validateTournamentDates('2026-11-20', '2026-11-25')).toBeNull();
    expect(validateTournamentDates('2026-11-25', '2026-11-20')).toBe(
      'The end date must be equal to or later than the start date.',
    );
  });

  it('blocks deletion while a tournament is in progress', () => {
    expect(canDeleteTournament('IN_PROGRESS')).toBe(false);
    expect(canDeleteTournament('FINISHED')).toBe(true);
  });
});
