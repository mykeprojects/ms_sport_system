import { canManageRegistrations } from './tournament-registration.rules';

describe('tournament registration rules', () => {
  it('allows registrations while draft or open', () => {
    expect(canManageRegistrations('DRAFT')).toBe(true);
    expect(canManageRegistrations('REGISTRATION_OPEN')).toBe(true);
  });

  it('closes registrations during or after the tournament', () => {
    expect(canManageRegistrations('IN_PROGRESS')).toBe(false);
    expect(canManageRegistrations('FINISHED')).toBe(false);
    expect(canManageRegistrations('CANCELLED')).toBe(false);
  });
});
