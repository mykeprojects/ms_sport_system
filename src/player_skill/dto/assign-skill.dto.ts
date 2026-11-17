import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AssignSkillDto {
  @Type(() => Number)
  @IsInt()
  skillId: number;
}
