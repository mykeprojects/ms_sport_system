import { Injectable, NotFoundException } from '@nestjs/common';
import { listSkills } from '../catalog/catalog.queries';
import { deleteSkill, saveSkill } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import type { SaveSkillDto } from './dto/save-skill.dto';
import { SkillMapper } from './mappers/skill.mapper';

@Injectable()
export class SkillService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: SkillMapper,
  ) {}

  async list(q?: string, category?: string) {
    const state = await this.store.load();
    return listSkills(state, { q, category });
  }

  async findOne(id: number) {
    const state = await this.store.load();
    return this.orThrow(state, id);
  }

  async create(dto: SaveSkillDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, this.mapper.toInput(dto)));
    return { message: saved.message, skill: await this.findOne(saved.id!) };
  }

  async update(id: number, dto: SaveSkillDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, this.mapper.toInput(dto, id)));
    return { message: saved.message, skill: await this.findOne(saved.id!) };
  }

  async remove(id: number) {
    const saved = await this.store.mutate((state) => deleteSkill(state, id));
    return { message: saved.message };
  }

  private orThrow(state: Awaited<ReturnType<CatalogStore['load']>>, id: number) {
    const skill = this.mapper.toResponse(state, id);
    if (!skill) throw new NotFoundException('Skill not found.');
    return skill;
  }
}
