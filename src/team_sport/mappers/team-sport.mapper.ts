import { Injectable } from '@nestjs/common';
import type { TeamView } from '../../catalog/catalog.queries';

@Injectable()
export class TeamSportMapper {
  toResponse(team: TeamView) {
    return team.sports;
  }
}
