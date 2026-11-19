import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TOURNAMENT_STATUSES } from '../tournament.constants';
import type { TournamentStatus } from '../tournament.constants';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  sportId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(TOURNAMENT_STATUSES)
  status?: TournamentStatus;
}
