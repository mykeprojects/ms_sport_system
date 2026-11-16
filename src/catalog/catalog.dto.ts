import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { SkillCategory, Status } from './catalog.types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function optionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
const STATUSES: Status[] = ['activo', 'inactivo'];
const SKILL_CATEGORIES: SkillCategory[] = ['Física', 'Técnica', 'Táctica', 'Mental'];

export class SaveDeporteDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'La descripción admite máximo 250 caracteres.' })
  description?: string;

  @IsIn(STATUSES, { message: 'El estado debe ser activo o inactivo.' })
  status: Status;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  subdeportes?: string[];
}

export class SaveEquipoDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(40)
  shortName: string;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(80)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsIn(STATUSES, { message: 'El estado debe ser activo o inactivo.' })
  status: Status;
}

export class AsociarDeporteDto {
  @Type(() => Number)
  @IsInt()
  deporteId: number;
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

export class AsignarVinculacionDto {
  @Type(() => Number)
  @IsInt()
  jugadorId: number;

  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  startDate: string;

  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  endDate: string;
}

export class ActualizarVinculacionDto {
  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  startDate: string;

  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  endDate: string;
}

export class RetirarVinculacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  detail?: string;
}

export class SaveHabilidadDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(120)
  name: string;

  @IsIn(SKILL_CATEGORIES, { message: 'La categoría debe ser Física, Técnica, Táctica o Mental.' })
  category: SkillCategory;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(250)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  glyph?: string;
}

export class AsignarHabilidadDto {
  @Type(() => Number)
  @IsInt()
  habilidadId: number;
}
