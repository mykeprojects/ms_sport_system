import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AssignSportDto {
  @Type(() => Number)
  @IsInt()
  sportId: number;
}
