import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  TournamentPhaseStatus,
  TournamentPhaseType,
} from '../entities/tournament-phase.entity';

export const TOURNAMENT_PHASE_TYPES = ['GROUPS', 'KNOCKOUT'] as const;
export const TOURNAMENT_PHASE_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
] as const;

export class CreateTournamentPhaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsInt()
  @Min(1)
  @Max(100)
  phaseOrder: number;

  @IsIn(TOURNAMENT_PHASE_TYPES)
  phaseType: TournamentPhaseType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(TOURNAMENT_PHASE_STATUSES)
  status?: TournamentPhaseStatus;
}
