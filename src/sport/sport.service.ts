import { Injectable, NotFoundException } from '@nestjs/common';
import { assertStatus } from '../catalog/catalog.http';
import { listSports } from '../catalog/catalog.queries';
import { deleteSport, saveSport } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveSportDto } from './dto/save-sport.dto';
import { SportMapper } from './mappers/sport.mapper';

@Injectable()
export class SportService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: SportMapper,
  ) {}

  async list(q?: string, status?: string, soloPadres?: string) {
    assertStatus(status);
    const state = await this.store.load();
    return listSports(state, { q, status, soloPadres: soloPadres === 'true' });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveSportDto) {
    const saved = await this.store.mutate((state) => saveSport(state, this.mapper.toInput(dto)));
    const state = await this.store.load();
    return { message: saved.message, sport: this.orThrow(state, saved.id!) };
  }

  async update(id: number, dto: SaveSportDto) {
    const saved = await this.store.mutate((state) => saveSport(state, this.mapper.toInput(dto, id)));
    const state = await this.store.load();
    return { message: saved.message, sport: this.orThrow(state, saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deleteSport(state, id));
    return { message: saved.message };
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const sport = state.sports.find((item) => item.id === id);
    if (!sport) throw new NotFoundException('Sport not found.');
    return this.mapper.toResponse(state, sport);
  }
}
