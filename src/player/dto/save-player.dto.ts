import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import type { Status } from '../../catalog/catalog.types';

const STATUSES: Status[] = ['active', 'inactive'];

function optionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export class SavePlayerDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(160)
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(40)
  document: string;

  @Type(() => Number)
  @IsInt({ message: 'Age must be between 15 and 50 years.' })
  @Min(15, { message: 'Age must be between 15 and 50 years.' })
  @Max(50, { message: 'Age must be between 15 and 50 years.' })
  age: number;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(80)
  nationality: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(20)
  position: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Height must be between 1.40 m and 2.30 m.' })
  @Min(1.4, { message: 'Height must be between 1.40 m and 2.30 m.' })
  @Max(2.3, { message: 'Height must be between 1.40 m and 2.30 m.' })
  heightM: number;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(20)
  dominantFoot: string;

  @IsIn(STATUSES, { message: 'Status must be active or inactive.' })
  status: Status;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ValidateIf((dto: SavePlayerDto) => Boolean(dto.email?.trim()))
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => optionalInt(value))
  @IsInt()
  preferredSportId?: number | null;

  @IsOptional()
  @Transform(({ value }) => optionalInt(value))
  @IsInt()
  teamId?: number | null;
}
