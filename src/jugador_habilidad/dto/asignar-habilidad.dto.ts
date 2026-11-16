import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AsignarHabilidadDto {
  @Type(() => Number)
  @IsInt()
  habilidadId: number;
}
