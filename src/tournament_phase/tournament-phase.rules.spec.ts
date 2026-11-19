import {
  canDeletePhase,
  normalizePhaseName,
  phaseNameKey,
  validatePhaseDates,
} from './tournament-phase.rules';

describe('tournament phase rules', () => {
  it('normalizes names', () => {
    expect(normalizePhaseName('  Fase   Principal  ')).toBe('Fase Principal');
    expect(phaseNameKey('Fase Única')).toBe('fase unica');
  });

  it('validates chronological dates', () => {
    expect(validatePhaseDates('2026-12-01', '2026-12-10')).toBeNull();
    expect(validatePhaseDates('2026-12-10', '2026-12-01')).toBe(
      'The end date must be equal to or later than the start date.',
    );
  });

  it('prevents deleting an active phase', () => {
    expect(canDeletePhase('IN_PROGRESS')).toBe(false);
    expect(canDeletePhase('PLANNED')).toBe(true);
  });
});
