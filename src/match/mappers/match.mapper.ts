import { Injectable } from '@nestjs/common';
import type { CreateMatchDto, UpdateMatchDto } from '../dto/match.dtos';
import { MatchResponseDto, toMatchResponse } from '../dto/match-response.dto';
import { Match } from '../entities/match.entity';

@Injectable()
export class MatchMapper {
  toResponse(match: Match): MatchResponseDto {
    return toMatchResponse(match);
  }

  toResponseList(matches: Match[]): MatchResponseDto[] {
    return matches.map((match) => toMatchResponse(match));
  }

  toCreateEntity(dto: CreateMatchDto): Match {
    const entity = new Match();
    entity.homeTeam = dto.homeTeam.trim();
    entity.awayTeam = dto.awayTeam.trim();
    entity.sportId = dto.sportId ?? null;
    entity.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    entity.startsAt = new Date(dto.startsAt);
    entity.bettingClosesAt = dto.bettingClosesAt
      ? new Date(dto.bettingClosesAt)
      : new Date(dto.startsAt);
    entity.status = dto.status ?? 'SCHEDULED';
    entity.bettingEnabled = dto.bettingEnabled ?? true;
    entity.officialResult = null;
    entity.homeOdd = dto.homeOdd;
    entity.awayOdd = dto.awayOdd;
    entity.drawOdd = dto.drawOdd;
    return entity;
  }

  applyUpdate(entity: Match, dto: UpdateMatchDto): Match {
    if (dto.homeTeam !== undefined) entity.homeTeam = dto.homeTeam.trim();
    if (dto.awayTeam !== undefined) entity.awayTeam = dto.awayTeam.trim();
    if (dto.sportId !== undefined) entity.sportId = dto.sportId;
    if (dto.scheduledAt !== undefined) entity.scheduledAt = new Date(dto.scheduledAt);
    if (dto.startsAt !== undefined) entity.startsAt = new Date(dto.startsAt);
    if (dto.bettingClosesAt !== undefined) entity.bettingClosesAt = new Date(dto.bettingClosesAt);
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.bettingEnabled !== undefined) entity.bettingEnabled = dto.bettingEnabled;
    if (dto.homeOdd !== undefined) entity.homeOdd = dto.homeOdd;
    if (dto.awayOdd !== undefined) entity.awayOdd = dto.awayOdd;
    if (dto.drawOdd !== undefined) entity.drawOdd = dto.drawOdd;
    return entity;
  }
}
