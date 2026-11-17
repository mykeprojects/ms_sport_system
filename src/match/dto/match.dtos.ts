import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MATCH_STATUSES, OFFICIAL_RESULTS } from '../match.constants';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  homeTeam!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  awayTeam!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sportId?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsDateString()
  startsAt!: string;

  /** Defaults to `startsAt` when omitted. */
  @IsOptional()
  @IsDateString()
  bettingClosesAt?: string;

  @IsOptional()
  @IsIn(MATCH_STATUSES, { message: 'Invalid match status.' })
  status?: (typeof MATCH_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  bettingEnabled?: boolean;

  @IsNumber()
  @Min(1, { message: 'The home odd must be at least 1.' })
  homeOdd!: number;

  @IsNumber()
  @Min(1, { message: 'The away odd must be at least 1.' })
  awayOdd!: number;

  @IsNumber()
  @Min(1, { message: 'The draw odd must be at least 1.' })
  drawOdd!: number;
}

export class UpdateMatchDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  homeTeam?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  awayTeam?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sportId?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  bettingClosesAt?: string;

  @IsOptional()
  @IsIn(MATCH_STATUSES, { message: 'Invalid match status.' })
  status?: (typeof MATCH_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  bettingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'The home odd must be at least 1.' })
  homeOdd?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'The away odd must be at least 1.' })
  awayOdd?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'The draw odd must be at least 1.' })
  drawOdd?: number;
}

export class RegisterResultDto {
  @IsIn(OFFICIAL_RESULTS, { message: 'Invalid official result.' })
  officialResult!: (typeof OFFICIAL_RESULTS)[number];
}
