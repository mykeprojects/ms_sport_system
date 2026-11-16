import { Injectable } from '@nestjs/common';
import { associateSport, removeSportAssociation } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { EquipoService } from '../equipo/equipo.service';
import { EquipoDeporteMapper } from './mappers/equipo-deporte.mapper';

@Injectable()
export class EquipoDeporteService {
  constructor(
    private readonly store: CatalogStore,
    private readonly equipos: EquipoService,
    private readonly mapper: EquipoDeporteMapper,
  ) {}

  async list(teamId: number) {
    const team = await this.equipos.findOne(teamId);
    return this.mapper.toResponse(team);
  }

  async associate(teamId: number, deporteId: number) {
    const saved = await this.store.mutate((state) => associateSport(state, teamId, deporteId));
    return { message: saved.message, deportes: await this.list(teamId) };
  }

  async remove(teamId: number, deporteId: number) {
    const saved = await this.store.mutate((state) => removeSportAssociation(state, teamId, deporteId));
    return { message: saved.message, deportes: await this.list(teamId) };
  }
}
