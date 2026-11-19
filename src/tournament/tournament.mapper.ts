import { Injectable } from '@nestjs/common';
import { Tournament } from './entities/tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { normalizeTournamentName, tournamentNameKey } from './tournament.rules';

@Injectable()
export class TournamentMapper {
  toResponse(tournament: Tournament): TournamentResponseDto {
    return { ...tournament };
  }

  toCreateEntity(dto: CreateTournamentDto): Tournament {
    const tournament = new Tournament();
    tournament.name = normalizeTournamentName(dto.name);
    tournament.nameKey = tournamentNameKey(dto.name);
    tournament.description = dto.description?.trim() ?? '';
    tournament.sportId = dto.sportId;
    tournament.location = dto.location?.trim() || null;
    tournament.startDate = dto.startDate;
    tournament.endDate = dto.endDate;
    tournament.status = dto.status ?? 'DRAFT';
    return tournament;
  }

  applyUpdate(tournament: Tournament, dto: UpdateTournamentDto): Tournament {
    if (dto.name !== undefined) {
      tournament.name = normalizeTournamentName(dto.name);
      tournament.nameKey = tournamentNameKey(dto.name);
    }
    if (dto.description !== undefined) tournament.description = dto.description.trim();
    if (dto.sportId !== undefined) tournament.sportId = dto.sportId;
    if (dto.location !== undefined) tournament.location = dto.location.trim() || null;
    if (dto.startDate !== undefined) tournament.startDate = dto.startDate;
    if (dto.endDate !== undefined) tournament.endDate = dto.endDate;
    if (dto.status !== undefined) tournament.status = dto.status;
    return tournament;
  }
}
