export function normalizeGroupName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function groupNameKey(value: string): string {
  return normalizeGroupName(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function canAssignTeam(maxTeams: number | null, assignedCount: number): boolean {
  return maxTeams == null || assignedCount < maxTeams;
}
