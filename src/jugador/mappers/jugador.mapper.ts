import { Injectable } from '@nestjs/common';
import { toPlayer } from '../../catalog/catalog.queries';
import type { CatalogState, PlayerRecord } from '../../catalog/catalog.types';
import type { SaveJugadorDto } from '../dto/save-jugador.dto';

@Injectable()
export class JugadorMapper {
  toResponse(state: CatalogState, player: PlayerRecord) {
    return toPlayer(state, player);
  }

  toInput(dto: SaveJugadorDto) {
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
