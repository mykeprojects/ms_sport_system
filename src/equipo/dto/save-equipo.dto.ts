import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Status } from '../../catalog/catalog.types';

const STATUSES: Status[] = ['activo', 'inactivo'];

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
