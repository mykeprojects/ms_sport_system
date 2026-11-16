import { Injectable } from '@nestjs/common';
import { buildPerfil } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class PerfilMapper {
  toResponse(state: CatalogState, playerId: number) {
    return buildPerfil(state, playerId);
  }
}
