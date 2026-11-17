import { Injectable, NotFoundException } from '@nestjs/common';
import { assertStatus, optionalId } from '../catalog/catalog.http';
import { listTeams } from '../catalog/catalog.queries';
import { deleteTeam, saveTeam } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveTeamDto } from './dto/save-team.dto';
import { TeamMapper } from './mappers/team.mapper';

@Injectable()
export class TeamService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: TeamMapper,
  ) {}

  async list(q?: string, status?: string, sportId?: string) {
    assertStatus(status);
    const state = await this.store.load();
    return listTeams(state, { q, status, sportId: optionalId(sportId) });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveTeamDto) {
    const saved = await this.store.mutate((state) => saveTeam(state, this.mapper.toInput(dto)));
    const state = await this.store.load();
    return { message: saved.message, team: this.orThrow(state, saved.id!) };
  }

  async update(id: number, dto: SaveTeamDto) {
    const saved = await this.store.mutate((state) => saveTeam(state, this.mapper.toInput(dto, id)));
    const state = await this.store.load();
    return { message: saved.message, team: this.orThrow(state, saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deleteTeam(state, id));
    return { message: saved.message };
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const team = state.teams.find((item) => item.id === id);
    if (!team) throw new NotFoundException('Team not found.');
    return this.mapper.toResponse(state, team);
  }
}
