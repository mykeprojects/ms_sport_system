import { Injectable, NotFoundException } from '@nestjs/common';
import { listHabilidades } from '../catalog/catalog.queries';
import { deleteSkill, saveSkill } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveHabilidadDto } from './dto/save-habilidad.dto';
import { HabilidadMapper } from './mappers/habilidad.mapper';

@Injectable()
export class HabilidadService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: HabilidadMapper,
  ) {}

  async list(q?: string, category?: string) {
    const state = await this.store.load();
    return listHabilidades(state, { q, category });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveHabilidadDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, this.mapper.toInput(dto)));
    return { message: saved.message, habilidad: await this.findOne(saved.id!) };
  }

  async update(id: number, dto: SaveHabilidadDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, this.mapper.toInput(dto, id)));
    return { message: saved.message, habilidad: await this.findOne(saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deleteSkill(state, id));
    return { message: saved.message };
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const skill = this.mapper.toResponse(state, id);
    if (!skill) throw new NotFoundException('No se encontró la habilidad.');
    return skill;
  }
}
