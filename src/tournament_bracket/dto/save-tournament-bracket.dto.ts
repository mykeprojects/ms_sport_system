import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import type { TournamentBracketRound, TournamentBracketStatus } from '../entities/tournament-bracket.entity';

export const BRACKET_ROUNDS = ['QUARTERFINAL', 'SEMIFINAL', 'FINAL'] as const;
export const BRACKET_STATUSES = ['PENDING', 'FINISHED', 'CANCELLED'] as const;

export class SaveTournamentBracketDto {
  @IsIn(BRACKET_ROUNDS)
  roundType: TournamentBracketRound;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bracketOrder: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamAId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamBId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  winnerTeamId?: number | null;

  @IsOptional()
  @IsIn(BRACKET_STATUSES)
  status?: TournamentBracketStatus;
}
