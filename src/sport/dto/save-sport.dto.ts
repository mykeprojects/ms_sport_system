import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Status } from '../../catalog/catalog.types';

const STATUSES: Status[] = ['active', 'inactive'];

export class SaveSportDto {
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
  @MaxLength(250, { message: 'Description cannot exceed 250 characters.' })
  description?: string;

  @IsIn(STATUSES, { message: 'Status must be active or inactive.' })
  status: Status;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  subsports?: string[];
}
