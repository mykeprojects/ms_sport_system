import { Injectable } from '@nestjs/common';
import type { TeamView } from '../../catalog/catalog.queries';

@Injectable()
export class EquipoDeporteMapper {
  toResponse(team: TeamView) {
    return team.deportes;
  }
}
