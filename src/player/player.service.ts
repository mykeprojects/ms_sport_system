import { Injectable, NotFoundException } from '@nestjs/common';
import { assertStatus, optionalId } from '../catalog/catalog.http';
import { listPlayers } from '../catalog/catalog.queries';
import { deletePlayer, savePlayer } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SavePlayerDto } from './dto/save-player.dto';
import { PlayerMapper } from './mappers/player.mapper';
import { ProfileMapper } from './mappers/profile.mapper';

@Injectable()
export class PlayerService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: PlayerMapper,
    private readonly profileMapper: ProfileMapper,
  ) {}

  async list(q?: string, status?: string, teamId?: string, sportId?: string) {
    assertStatus(status);
    const state = await this.store.load();
    return listPlayers(state, {
      q,
      status,
      teamId: optionalId(teamId),
      sportId: optionalId(sportId),
    });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SavePlayerDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, { ...this.mapper.toInput(dto), teamId: dto.teamId ?? null, syncTeam: true }),
    );
    const state = await this.store.load();
    return { message: saved.message, player: this.orThrow(state, saved.id!) };
  }

  async update(id: number, dto: SavePlayerDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, {
        ...this.mapper.toInput(dto),
        id,
        teamId: dto.teamId,
        syncTeam: dto.teamId !== undefined,
      }),
    );
    const state = await this.store.load();
    return { message: saved.message, player: this.orThrow(state, saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deletePlayer(state, id));
    return { message: saved.message };
  }

  async profile(id: number) {
    const state = await this.store.load();
    const profile = this.profileMapper.toResponse(state, id);
    if (!profile) throw new NotFoundException('Player not found.');
    return profile;
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const player = state.players.find((item) => item.id === id);
    if (!player) throw new NotFoundException('Player not found.');
    return this.mapper.toResponse(state, player);
  }
}
