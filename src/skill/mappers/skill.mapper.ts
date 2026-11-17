import { Injectable } from '@nestjs/common';
import { listSkills } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';
import type { SaveSkillDto } from '../dto/save-skill.dto';

@Injectable()
export class SkillMapper {
  toResponse(state: CatalogState, id: number) {
    return listSkills(state, {}).find((item) => item.id === id) ?? null;
  }

  toInput(dto: SaveSkillDto, id?: number) {
    return { id, name: dto.name, category: dto.category, description: dto.description, glyph: dto.glyph };
  }
}
