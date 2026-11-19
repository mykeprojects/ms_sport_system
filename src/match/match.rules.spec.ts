import {
  canModifyMatch,
  isDateWithinRange,
  isDuplicateMatchSlot,
  isOpenForBetting,
  sameTeamPair,
} from './match.rules';
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

describe('match scheduling rules', () => {
  it('accepts dates inside the tournament and phase ranges', () => {
    expect(isDateWithinRange('2030-01-10T20:00:00Z', '2030-01-01', '2030-01-31')).toBe(true);
    expect(isDateWithinRange('2030-01-01T00:00:00Z', '2030-01-01', '2030-01-31')).toBe(true);
    expect(isDateWithinRange('2030-01-31T23:59:00Z', '2030-01-01', '2030-01-31')).toBe(true);
  });

  it('rejects dates outside the range', () => {
    expect(isDateWithinRange('2029-12-31T23:00:00Z', '2030-01-01', '2030-01-31')).toBe(false);
    expect(isDateWithinRange('2030-02-01T00:00:00Z', '2030-01-01', '2030-01-31')).toBe(false);
  });

  it('only allows scheduling changes on scheduled or in-progress matches', () => {
    expect(canModifyMatch('SCHEDULED')).toBe(true);
    expect(canModifyMatch('BETTING_OPEN')).toBe(true);
    expect(canModifyMatch('IN_PROGRESS')).toBe(true);
    expect(canModifyMatch('FINISHED')).toBe(false);
    expect(canModifyMatch('CANCELLED')).toBe(false);
  });

  it('compares team pairs regardless of home and away order', () => {
    expect(sameTeamPair(1, 2, 1, 2)).toBe(true);
    expect(sameTeamPair(1, 2, 2, 1)).toBe(true);
    expect(sameTeamPair(1, 2, 1, 3)).toBe(false);
  });

  const baseSlot = {
    id: 1,
    tournamentId: 10,
    phaseId: 20,
    roundLabel: 'Grupo A',
    homeTeamId: 1,
    awayTeamId: 2,
    startsAt: new Date('2030-01-10T20:00:00Z'),
  };

  it('detects duplicated matches in the same phase, round and team pair', () => {
    expect(
      isDuplicateMatchSlot(
        { ...baseSlot, id: undefined, startsAt: new Date('2030-01-12T20:00:00Z') },
        baseSlot,
      ),
    ).toBe(true);
    expect(
      isDuplicateMatchSlot(
        { ...baseSlot, id: undefined, awayTeamId: 1, homeTeamId: 2 },
        baseSlot,
      ),
    ).toBe(true);
  });

  it('allows a rematch when the round label changes', () => {
    expect(
      isDuplicateMatchSlot(
        { ...baseSlot, id: undefined, roundLabel: 'Grupo A - vuelta' },
        baseSlot,
      ),
    ).toBe(false);
  });

  it('ignores the match itself when validating an update', () => {
    expect(isDuplicateMatchSlot({ ...baseSlot, roundLabel: 'grupo a' }, baseSlot)).toBe(false);
  });

  it('uses the exact start time for legacy matches without tournament', () => {
    const legacy = {
      id: 3,
      tournamentId: null,
      phaseId: null,
      roundLabel: null,
      homeTeamId: 1,
      awayTeamId: 2,
      startsAt: new Date('2030-01-10T20:00:00Z'),
    };
    expect(
      isDuplicateMatchSlot(
        { ...legacy, id: undefined, startsAt: new Date('2030-01-10T20:00:00Z') },
        legacy,
      ),
    ).toBe(true);
    expect(
      isDuplicateMatchSlot(
        { ...legacy, id: undefined, startsAt: new Date('2030-01-10T22:00:00Z') },
        legacy,
      ),
    ).toBe(false);
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
