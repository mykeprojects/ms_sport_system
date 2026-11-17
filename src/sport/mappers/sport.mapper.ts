import { Injectable } from '@nestjs/common';
import { toSport } from '../../catalog/catalog.queries';
import type { CatalogState, SportRecord } from '../../catalog/catalog.types';
import type { SaveSportDto } from '../dto/save-sport.dto';

@Injectable()
export class SportMapper {
  toResponse(state: CatalogState, sport: SportRecord) {
    return toSport(state, sport);
  }

  toInput(dto: SaveSportDto, id?: number) {
    return {
      id,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? '',
      status: dto.status,
      subsports: dto.subsports ?? [],
    };
  }
}
