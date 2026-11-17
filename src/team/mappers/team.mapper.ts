import { Injectable } from '@nestjs/common';
import { toTeam } from '../../catalog/catalog.queries';
import type { CatalogState, TeamRecord } from '../../catalog/catalog.types';
import type { SaveTeamDto } from '../dto/save-team.dto';

@Injectable()
export class TeamMapper {
  toResponse(state: CatalogState, team: TeamRecord) {
    return toTeam(state, team);
  }

  toInput(dto: SaveTeamDto, id?: number) {
    return {
      id,
      name: dto.name,
      shortName: dto.shortName,
      city: dto.city,
      description: dto.description ?? '',
      status: dto.status,
    };
  }
}
