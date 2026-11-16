import { Injectable } from '@nestjs/common';
import { buildPlantilla } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class VinculacionMapper {
  toPlantilla(state: CatalogState, teamId: number) {
    return buildPlantilla(state, teamId);
  }
}
