import { isOpenForBetting } from './match.rules';
import type { OfficialResult } from './match.constants';

describe('match.rules', () => {
  const baseMatch = {
    status: 'SCHEDULED' as const,
    bettingEnabled: true,
    startsAt: new Date('2030-01-01T20:00:00Z'),
    bettingClosesAt: new Date('2030-01-01T19:30:00Z'),
  };
  const now = new Date('2030-01-01T12:00:00Z');

  it('accepts bets while the match is scheduled and the window is open', () => {
    expect(isOpenForBetting(baseMatch, now)).toBe(true);
  });

  it('rejects bets when betting is disabled', () => {
    expect(isOpenForBetting({ ...baseMatch, bettingEnabled: false }, now)).toBe(false);
  });

  it('rejects bets once the match started or the window closed', () => {
    expect(
      isOpenForBetting({ ...baseMatch, status: 'IN_PROGRESS' }, now),
    ).toBe(false);
    expect(
      isOpenForBetting(baseMatch, new Date('2030-01-01T19:45:00Z')),
    ).toBe(false);
    expect(
      isOpenForBetting(baseMatch, new Date('2030-01-01T20:30:00Z')),
    ).toBe(false);
  });

  it('rejects bets on closed, finished or cancelled matches', () => {
    expect(isOpenForBetting({ ...baseMatch, status: 'BETTING_CLOSED' }, now)).toBe(false);
    expect(isOpenForBetting({ ...baseMatch, status: 'FINISHED' }, now)).toBe(false);
    expect(isOpenForBetting({ ...baseMatch, status: 'CANCELLED' }, now)).toBe(false);
  });
});

describe('bet settlement rules', () => {
  it('marks as won only when the selection matches the official result', () => {
    // Mirrors the comparison performed by BetService against officialResult.
    const settle = (selection: string, official: OfficialResult) =>
      official === 'VOID' ? 'VOIDED' : selection === official ? 'WON' : 'LOST';

    expect(settle('HOME', 'HOME')).toBe('WON');
    expect(settle('AWAY', 'HOME')).toBe('LOST');
    expect(settle('DRAW', 'VOID')).toBe('VOIDED');
  });

  it('computes the payout with the frozen odd and returns zero on losses', () => {
    const payout = (status: string, stake: number, odd: number) =>
      status === 'WON'
        ? Math.round(stake * odd * 100) / 100
        : status === 'VOIDED'
          ? stake
          : 0;

    expect(payout('WON', 100, 2.5)).toBe(250);
    expect(payout('LOST', 100, 2.5)).toBe(0);
    expect(payout('VOIDED', 100, 2.5)).toBe(100);
  });
});
