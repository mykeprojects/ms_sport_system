import { Injectable, NotFoundException } from '@nestjs/common';
import { assertStatus, optionalId } from '../catalog/catalog.http';
import { listJugadores } from '../catalog/catalog.queries';
import { deletePlayer, savePlayer } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveJugadorDto } from './dto/save-jugador.dto';
import { JugadorMapper } from './mappers/jugador.mapper';
import { PerfilMapper } from './mappers/perfil.mapper';

@Injectable()
export class JugadorService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: JugadorMapper,
    private readonly perfilMapper: PerfilMapper,
  ) {}

  async list(q?: string, status?: string, equipoId?: string, deporteId?: string) {
    assertStatus(status);
    const state = await this.store.load();
    return listJugadores(state, {
      q,
      status,
      equipoId: optionalId(equipoId),
      deporteId: optionalId(deporteId),
    });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveJugadorDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, { ...this.mapper.toInput(dto), teamId: dto.teamId ?? null, syncTeam: true }),
    );
    const state = await this.store.load();
    return { message: saved.message, jugador: this.orThrow(state, saved.id!) };
  }

  async update(id: number, dto: SaveJugadorDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, {
        ...this.mapper.toInput(dto),
        id,
        teamId: dto.teamId,
        syncTeam: dto.teamId !== undefined,
      }),
    );
    const state = await this.store.load();
    return { message: saved.message, jugador: this.orThrow(state, saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deletePlayer(state, id));
    return { message: saved.message };
  }

  async perfil(id: number) {
    const state = await this.store.load();
    const profile = this.perfilMapper.toResponse(state, id);
    if (!profile) throw new NotFoundException('No se encontró el jugador.');
    return profile;
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const player = state.players.find((item) => item.id === id);
    if (!player) throw new NotFoundException('No se encontró el jugador.');
    return this.mapper.toResponse(state, player);
  }
}
