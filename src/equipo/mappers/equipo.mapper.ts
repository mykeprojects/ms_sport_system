import { Injectable } from '@nestjs/common';
import { toTeam } from '../../catalog/catalog.queries';
import type { CatalogState, TeamRecord } from '../../catalog/catalog.types';
import type { SaveEquipoDto } from '../dto/save-equipo.dto';

@Injectable()
export class EquipoMapper {
  toResponse(state: CatalogState, team: TeamRecord) {
    return toTeam(state, team);
  }

  toInput(dto: SaveEquipoDto, id?: number) {
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
