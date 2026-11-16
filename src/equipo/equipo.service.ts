import { Injectable, NotFoundException } from '@nestjs/common';
import { assertStatus, optionalId } from '../catalog/catalog.http';
import { listEquipos } from '../catalog/catalog.queries';
import { deleteTeam, saveTeam } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveEquipoDto } from './dto/save-equipo.dto';
import { EquipoMapper } from './mappers/equipo.mapper';

@Injectable()
export class EquipoService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: EquipoMapper,
  ) {}

  async list(q?: string, status?: string, deporteId?: string) {
    assertStatus(status);
    const state = await this.store.load();
    return listEquipos(state, { q, status, deporteId: optionalId(deporteId) });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveEquipoDto) {
    const saved = await this.store.mutate((state) => saveTeam(state, this.mapper.toInput(dto)));
    const state = await this.store.load();
    return { message: saved.message, equipo: this.orThrow(state, saved.id!) };
  }

  async update(id: number, dto: SaveEquipoDto) {
    const saved = await this.store.mutate((state) => saveTeam(state, this.mapper.toInput(dto, id)));
    const state = await this.store.load();
    return { message: saved.message, equipo: this.orThrow(state, saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deleteTeam(state, id));
    return { message: saved.message };
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const team = state.teams.find((item) => item.id === id);
    if (!team) throw new NotFoundException('No se encontró el equipo.');
    return this.mapper.toResponse(state, team);
  }
}
