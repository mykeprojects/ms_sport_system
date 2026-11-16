import { Injectable } from '@nestjs/common';
import { buildPerfil } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class JugadorHabilidadMapper {
  toResponse(state: CatalogState, playerId: number) {
    const profile = buildPerfil(state, playerId);
    if (!profile) return null;
    return { habilidades: profile.habilidades, media: profile.media };
  }
}
