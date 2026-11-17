import { Injectable } from '@nestjs/common';
import { toPlayer } from '../../catalog/catalog.queries';
import type { CatalogState, PlayerRecord } from '../../catalog/catalog.types';
import type { SavePlayerDto } from '../dto/save-player.dto';

@Injectable()
export class PlayerMapper {
  toResponse(state: CatalogState, player: PlayerRecord) {
    return toPlayer(state, player);
  }

  toInput(dto: SavePlayerDto) {
    return {
      fullName: dto.fullName,
      document: dto.document,
      age: dto.age,
      nationality: dto.nationality,
      position: dto.position,
      heightM: dto.heightM,
      dominantFoot: dto.dominantFoot,
      status: dto.status,
      email: dto.email ?? '',
      phone: dto.phone ?? '',
      preferredSportId: dto.preferredSportId,
    };
  }
}
