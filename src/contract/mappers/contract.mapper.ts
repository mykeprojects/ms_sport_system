import { Injectable } from '@nestjs/common';
import { buildRoster } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class ContractMapper {
  toRoster(state: CatalogState, teamId: number) {
    return buildRoster(state, teamId);
  }
}
