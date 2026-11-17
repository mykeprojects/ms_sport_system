import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../player/entities/player.entity';
import { Match } from '../match/entities/match.entity';
import { Contract } from '../contract/entities/contract.entity';

@Injectable()
export class AnnotationParticipantService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
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
      where: { playerId: player.id, status: 'active' },
    });
    const teamId = contracts.find((contract) => participantTeamIds.includes(contract.teamId))?.teamId;
    if (!teamId) {
      throw new ConflictException(
        'The selected player does not belong to a team participating in this match.',
      );
    }
    return teamId;
  }

}
