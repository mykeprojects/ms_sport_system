export type RegistrationState = 'REGISTERED' | 'WITHDRAWN';

export function canManageRegistrations(status: string): boolean {
  return status === 'DRAFT' || status === 'REGISTRATION_OPEN';
}
