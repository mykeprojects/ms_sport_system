import type { Match } from '../entities/match.entity';
import type { MatchStatus, OfficialResult } from '../match.constants';

export class MatchResponseDto {
  id!: number;
  homeTeam!: string;
  awayTeam!: string;
  homeTeamId!: number;
  awayTeamId!: number;
  sportId!: number | null;
  scheduledAt!: Date | null;
  startsAt!: Date;
  bettingClosesAt!: Date;
  status!: MatchStatus;
  bettingEnabled!: boolean;
  officialResult!: OfficialResult | null;
  homeOdd!: number;
  awayOdd!: number;
  drawOdd!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export function toMatchResponse(match: Match): MatchResponseDto {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    sportId: match.sportId,
    scheduledAt: match.scheduledAt,
    startsAt: match.startsAt,
    bettingClosesAt: match.bettingClosesAt,
    status: match.status,
    bettingEnabled: match.bettingEnabled,
    officialResult: match.officialResult,
    homeOdd: match.homeOdd,
    awayOdd: match.awayOdd,
    drawOdd: match.drawOdd,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}
