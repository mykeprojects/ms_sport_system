import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AssignTournamentGroupTeamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId: number;
}
