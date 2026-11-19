export function normalizePhaseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function phaseNameKey(value: string): string {
  return normalizePhaseName(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function validatePhaseDates(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return 'The phase start and end dates are required.';
  if (endDate < startDate) return 'The end date must be equal to or later than the start date.';
  return null;
}

export function canDeletePhase(status: string): boolean {
  return status !== 'IN_PROGRESS';
}
