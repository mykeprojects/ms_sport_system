import { Type } from 'class-transformer';
import { IsInt, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class AsignarVinculacionDto {
  @Type(() => Number)
  @IsInt()
  jugadorId: number;

  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  startDate: string;

  @Matches(DATE, { message: 'La fecha debe tener formato aaaa-mm-dd.' })
  endDate: string;
}
