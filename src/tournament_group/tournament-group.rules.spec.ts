import { canAssignTeam, groupNameKey, normalizeGroupName } from './tournament-group.rules';

describe('tournament group rules', () => {
  it('normalizes group names', () => {
    expect(normalizeGroupName('  Grupo   Á  ')).toBe('Grupo Á');
    expect(groupNameKey('Grupo Único')).toBe('grupo unico');
  });

  it('checks group capacity', () => {
    expect(canAssignTeam(4, 3)).toBe(true);
    expect(canAssignTeam(4, 4)).toBe(false);
    expect(canAssignTeam(null, 100)).toBe(true);
  });
});
