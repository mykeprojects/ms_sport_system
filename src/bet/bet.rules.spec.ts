import {
  canCancelBet,
  cancellationRejection,
  isWithinStakeLimits,
  resolveBetStatus,
  roundMoney,
  settleAmount,
} from './bet.rules';

describe('bet.rules', () => {
  describe('resolveBetStatus', () => {
    it('marks the bet as won when the selection matches the official result', () => {
      expect(resolveBetStatus('HOME', 'HOME', 'FINISHED')).toBe('WON');
      expect(resolveBetStatus('DRAW', 'DRAW', 'FINISHED')).toBe('WON');
    });

    it('marks the bet as lost when the selection does not match', () => {
      expect(resolveBetStatus('HOME', 'AWAY', 'FINISHED')).toBe('LOST');
      expect(resolveBetStatus('DRAW', 'HOME', 'FINISHED')).toBe('LOST');
    });

    it('voids the bet when the match was cancelled or the result is void', () => {
      expect(resolveBetStatus('HOME', null, 'CANCELLED')).toBe('VOIDED');
      expect(resolveBetStatus('HOME', 'VOID', 'CANCELLED')).toBe('VOIDED');
      expect(resolveBetStatus('AWAY', 'VOID', 'FINISHED')).toBe('VOIDED');
    });
  });

  describe('settleAmount', () => {
    it('pays stake x frozen odd for won bets', () => {
      expect(settleAmount('WON', 100, 2.35)).toBe(235);
      expect(settleAmount('WON', 10, 1.55)).toBe(15.5);
    });

    it('pays zero for lost bets and returns the stake for voided bets', () => {
      expect(settleAmount('LOST', 100, 2.35)).toBe(0);
      expect(settleAmount('VOIDED', 100, 2.35)).toBe(100);
      expect(settleAmount('CANCELLED', 100, 2.35)).toBe(0);
    });

    it('rounds money to two decimals', () => {
      expect(roundMoney(33.333333)).toBe(33.33);
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(settleAmount('WON', 100, 2.5)).toBe(250);
    });
  });

  describe('isWithinStakeLimits', () => {
    it('accepts values inside the configurable range', () => {
      expect(isWithinStakeLimits(10, 1, 1_000_000)).toBe(true);
      expect(isWithinStakeLimits(1, 1, 1_000_000)).toBe(true);
      expect(isWithinStakeLimits(1_000_000, 1, 1_000_000)).toBe(true);
    });

    it('rejects values outside the range or not finite', () => {
      expect(isWithinStakeLimits(0.5, 1, 1_000_000)).toBe(false);
      expect(isWithinStakeLimits(1_000_001, 1, 1_000_000)).toBe(false);
      expect(isWithinStakeLimits(Number.NaN, 1, 1_000_000)).toBe(false);
    });
  });

  describe('canCancelBet', () => {
    const match = {
      status: 'SCHEDULED' as const,
      startsAt: new Date('2030-06-01T18:00:00Z'),
      bettingClosesAt: new Date('2030-06-01T17:30:00Z'),
    };
    const rules = { allowCancelBeforeStart: true, allowCancelBeforeBettingClose: true };

    it('allows cancellation while betting is open and before the start', () => {
      expect(canCancelBet(match, new Date('2030-06-01T12:00:00Z'), rules)).toBe(true);
      expect(canCancelBet(match, new Date('2030-06-01T17:45:00Z'), rules)).toBe(true);
    });

    it('never allows cancellation after the match started (HU)', () => {
      expect(canCancelBet(match, new Date('2030-06-01T18:00:01Z'), rules)).toBe(false);
      expect(
        canCancelBet(
          { ...match, status: 'IN_PROGRESS' as const },
          new Date('2030-06-01T19:00:00Z'),
          rules,
        ),
      ).toBe(false);
    });

    it('respects the configurable windows', () => {
      const beforeClose = new Date('2030-06-01T12:00:00Z');
      const afterClose = new Date('2030-06-01T17:45:00Z');
      // Between close and start: only `allowCancelBeforeStart` applies.
      expect(canCancelBet(match, afterClose, { ...rules, allowCancelBeforeStart: false })).toBe(
        false,
      );
      // While betting is open: only `allowCancelBeforeBettingClose` applies.
      expect(
        canCancelBet(match, beforeClose, { ...rules, allowCancelBeforeBettingClose: false }),
      ).toBe(false);
    });

    it('rejects cancellation on finished or cancelled matches', () => {
      expect(
        canCancelBet({ ...match, status: 'FINISHED' as const }, new Date('2030-06-01T12:00:00Z'), rules),
      ).toBe(false);
      expect(
        canCancelBet({ ...match, status: 'CANCELLED' as const }, new Date('2030-06-01T12:00:00Z'), rules),
      ).toBe(false);
    });

    it('explains the rejection reason', () => {
      expect(cancellationRejection(match, new Date('2030-06-01T19:00:00Z'))).toContain(
        'after the match started',
      );
      expect(cancellationRejection({ ...match, status: 'FINISHED' as const }, new Date())).toContain(
        'finished',
      );
    });
  });
});
