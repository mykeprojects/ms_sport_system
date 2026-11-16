import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import type { Status } from '../../catalog/catalog.types';

const STATUSES: Status[] = ['activo', 'inactivo'];

function optionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export class SaveJugadorDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(160)
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(40)
  document: string;

  @Type(() => Number)
  @IsInt({ message: 'La edad debe estar entre 15 y 50 años.' })
  @Min(15, { message: 'La edad debe estar entre 15 y 50 años.' })
  @Max(50, { message: 'La edad debe estar entre 15 y 50 años.' })
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
  @IsNumber({}, { message: 'La altura debe estar entre 1.40 m y 2.30 m.' })
  @Min(1.4, { message: 'La altura debe estar entre 1.40 m y 2.30 m.' })
  @Max(2.3, { message: 'La altura debe estar entre 1.40 m y 2.30 m.' })
  heightM: number;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(20)
  dominantFoot: string;

  @IsIn(STATUSES, { message: 'El estado debe ser activo o inactivo.' })
  status: Status;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ValidateIf((dto: SaveJugadorDto) => Boolean(dto.email?.trim()))
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
