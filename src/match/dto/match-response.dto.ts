import type { Match } from '../entities/match.entity';
import type { MatchStatus, OfficialResult } from '../match.constants';

export class MatchResponseDto {
  id!: number;
  homeTeam!: string;
  awayTeam!: string;
  homeTeamId!: number;
  awayTeamId!: number;
  sportId!: number | null;
  tournamentId!: number | null;
  phaseId!: number | null;
  bracketId!: number | null;
  groupId!: number | null;
  venue!: string | null;
  roundLabel!: string | null;
  scheduledAt!: Date | null;
  startsAt!: Date;
  bettingClosesAt!: Date;
  status!: MatchStatus;
  bettingEnabled!: boolean;
  officialResult!: OfficialResult | null;
  homeScore!: number;
  awayScore!: number;
  homeOdd!: number;
  awayOdd!: number;
  drawOdd!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export function toMatchResponse(
  match: Match,
  scores: { homeScore: number; awayScore: number } = { homeScore: 0, awayScore: 0 },
): MatchResponseDto {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    sportId: match.sportId,
    tournamentId: match.tournamentId,
    phaseId: match.phaseId,
    bracketId: match.bracketId,
    groupId: match.groupId,
    venue: match.venue,
    roundLabel: match.roundLabel,
    scheduledAt: match.scheduledAt,
    startsAt: match.startsAt,
    bettingClosesAt: match.bettingClosesAt,
    status: match.status,
    bettingEnabled: match.bettingEnabled,
    officialResult: match.officialResult,
    homeScore: scores.homeScore,
    awayScore: scores.awayScore,
    homeOdd: match.homeOdd,
    awayOdd: match.awayOdd,
    drawOdd: match.drawOdd,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}
