import { IsInt, Min } from 'class-validator';

export class FollowTeamDto {
  @IsInt()
  @Min(1)
  teamId: number;
}
