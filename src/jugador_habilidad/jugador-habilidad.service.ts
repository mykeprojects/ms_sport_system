import { Injectable, NotFoundException } from '@nestjs/common';
import { assignSkill, removePlayerSkill } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { JugadorHabilidadMapper } from './mappers/jugador-habilidad.mapper';

@Injectable()
export class JugadorHabilidadService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: JugadorHabilidadMapper,
  ) {}

  async assign(playerId: number, habilidadId: number) {
    const saved = await this.store.mutate((state) => assignSkill(state, playerId, habilidadId));
    const summary = await this.summary(playerId);
    return { message: saved.message, ...summary };
  }

  async remove(playerId: number, habilidadId: number) {
    const saved = await this.store.mutate((state) => removePlayerSkill(state, playerId, habilidadId));
    const summary = await this.summary(playerId);
    return { message: saved.message, ...summary };
  }

  private async summary(playerId: number) {
    const state = await this.store.load();
    const summary = this.mapper.toResponse(state, playerId);
    if (!summary) throw new NotFoundException('No se encontró el jugador.');
    return summary;
  }
}
