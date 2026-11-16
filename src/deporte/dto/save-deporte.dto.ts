import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Status } from '../../catalog/catalog.types';

const STATUSES: Status[] = ['activo', 'inactivo'];

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
