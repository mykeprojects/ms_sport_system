import { canDeleteBracket, roundName, validBracketTeamWinner } from './tournament-bracket.rules';

describe('tournament bracket rules', () => {
  it('validates that the winner belongs to the bracket', () => {
    expect(validBracketTeamWinner(1, 2, 2)).toBe(true);
    expect(validBracketTeamWinner(1, 2, 3)).toBe(false);
  });

  it('blocks deletion of finished brackets', () => {
    expect(canDeleteBracket('FINISHED')).toBe(false);
    expect(canDeleteBracket('PENDING')).toBe(true);
  });

  it('maps round labels', () => {
    expect(roundName('SEMIFINAL')).toBe('Semifinal');
  });
});
