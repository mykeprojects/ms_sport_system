import type { TournamentBracketStatus } from './entities/tournament-bracket.entity';

export function validBracketTeamWinner(
  teamAId: number | null,
  teamBId: number | null,
  winnerTeamId: number | null,
): boolean {
  return winnerTeamId == null || winnerTeamId === teamAId || winnerTeamId === teamBId;
}

export function canDeleteBracket(status: TournamentBracketStatus): boolean {
  return status !== 'FINISHED';
}

export function roundName(roundType: 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL'): string {
  if (roundType === 'QUARTERFINAL') return 'Cuartos de final';
  if (roundType === 'SEMIFINAL') return 'Semifinal';
  return 'Final';
}
