import { Injectable } from '@nestjs/common';
import type { CreateMatchDto, UpdateMatchDto } from '../dto/match.dtos';
import { MatchResponseDto, toMatchResponse } from '../dto/match-response.dto';
import { Match } from '../entities/match.entity';

@Injectable()
export class MatchMapper {
  toResponse(
    match: Match,
    scores: { homeScore: number; awayScore: number } = { homeScore: 0, awayScore: 0 },
  ): MatchResponseDto {
    return toMatchResponse(match, scores);
  }

  toResponseList(
    matches: Match[],
    scores: Map<number, { homeScore: number; awayScore: number }> = new Map(),
  ): MatchResponseDto[] {
    return matches.map((match) =>
      toMatchResponse(match, scores.get(match.id) ?? { homeScore: 0, awayScore: 0 }),
    );
  }

  toCreateEntity(dto: CreateMatchDto): Match {
    const entity = new Match();
    entity.homeTeam = dto.homeTeam.trim();
    entity.awayTeam = dto.awayTeam.trim();
    entity.homeTeamId = dto.homeTeamId;
    entity.awayTeamId = dto.awayTeamId;
    entity.sportId = dto.sportId ?? null;
    entity.tournamentId = dto.tournamentId ?? null;
    entity.phaseId = dto.phaseId ?? null;
    entity.bracketId = dto.bracketId ?? null;
    entity.groupId = dto.groupId ?? null;
    entity.venue = dto.venue?.trim() || null;
    entity.roundLabel = dto.roundLabel?.trim() || null;
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
    if (dto.homeTeamId !== undefined) entity.homeTeamId = dto.homeTeamId;
    if (dto.awayTeamId !== undefined) entity.awayTeamId = dto.awayTeamId;
    if (dto.sportId !== undefined) entity.sportId = dto.sportId;
    if (dto.tournamentId !== undefined) entity.tournamentId = dto.tournamentId;
    if (dto.phaseId !== undefined) entity.phaseId = dto.phaseId;
    if (dto.bracketId !== undefined) entity.bracketId = dto.bracketId;
    if (dto.groupId !== undefined) entity.groupId = dto.groupId;
    if (dto.venue !== undefined) entity.venue = dto.venue.trim() || null;
    if (dto.roundLabel !== undefined) entity.roundLabel = dto.roundLabel.trim() || null;
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
