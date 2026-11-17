import { Injectable } from '@nestjs/common';
import { buildProfile } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class ProfileMapper {
  toResponse(state: CatalogState, playerId: number) {
    return buildProfile(state, playerId);
  }
}
