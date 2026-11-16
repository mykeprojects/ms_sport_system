import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AsociarDeporteDto {
  @Type(() => Number)
  @IsInt()
  deporteId: number;
}
