import type { Tournament } from '../../tournament/entities/tournament.entity';
import type { TournamentPhase } from '../../tournament_phase/entities/tournament-phase.entity';
import type { GroupStandingsResult, KnockoutRound } from '../tournament-development.rules';

export interface TournamentDevelopmentPhase {
  id: number;
  tournamentId: number;
  name: string;
  phaseOrder: number;
  phaseType: TournamentPhase['phaseType'];
  status: TournamentPhase['status'];
  startDate: string;
  endDate: string;
  groups?: GroupStandingsResult[];
  knockoutRounds?: KnockoutRound[];
}

export interface TournamentDevelopmentResponse {
  tournament: {
    id: number;
    name: string;
    status: Tournament['status'];
    startDate: string;
    endDate: string;
    sportId: number;
    location: string | null;
  };
  phases: TournamentDevelopmentPhase[];
}

export type { GroupStandingsResult, KnockoutRound, StandingRow, StandingTeamRef, KnockoutMatchup } from '../tournament-development.rules';
