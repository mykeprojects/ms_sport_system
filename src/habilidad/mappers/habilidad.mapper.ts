import { Injectable } from '@nestjs/common';
import { listHabilidades } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';
import type { SaveHabilidadDto } from '../dto/save-habilidad.dto';

@Injectable()
export class HabilidadMapper {
  toResponse(state: CatalogState, id: number) {
    return listHabilidades(state, {}).find((item) => item.id === id) ?? null;
  }

  toInput(dto: SaveHabilidadDto, id?: number) {
    return { id, name: dto.name, category: dto.category, description: dto.description, glyph: dto.glyph };
  }
}
