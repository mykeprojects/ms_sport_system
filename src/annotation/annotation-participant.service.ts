import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from '../jugador/entities/jugador.entity';
import { Match } from '../match/entities/match.entity';
import { Vinculacion } from '../vinculacion/entities/vinculacion.entity';

@Injectable()
export class AnnotationParticipantService {
  constructor(
    @InjectRepository(Jugador)
    private readonly playerRepository: Repository<Jugador>,
    @InjectRepository(Vinculacion)
    private readonly contractRepository: Repository<Vinculacion>,
  ) {}

  async resolveTeamId(match: Match, playerId: number): Promise<number> {
    const player = await this.playerRepository.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException(`Player #${playerId} was not found.`);

    const participantTeamIds = [match.homeTeamId, match.awayTeamId];
    if (
      !Number.isInteger(participantTeamIds[0]) ||
      !Number.isInteger(participantTeamIds[1]) ||
      participantTeamIds[0] === participantTeamIds[1]
    ) {
      throw new ConflictException(
        'The match must have two different registered participant teams.',
      );
    }

    const contracts = await this.contractRepository.find({
      where: { jugadorId: player.id, status: 'activo' },
    });
    const teamId = contracts.find((contract) => participantTeamIds.includes(contract.equipoId))?.equipoId;
    if (!teamId) {
      throw new ConflictException(
        'The selected player does not belong to a team participating in this match.',
      );
    }
    return teamId;
  }

}
