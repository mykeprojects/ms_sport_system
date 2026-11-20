import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Match } from '../match/entities/match.entity';
import { Team } from '../team/entities/team.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentBracket } from '../tournament_bracket/entities/tournament-bracket.entity';
import { TournamentGroup } from '../tournament_group/entities/tournament-group.entity';
import { TournamentGroupTeam } from '../tournament_group/entities/tournament-group-team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import type {
  TournamentDevelopmentPhase,
  TournamentDevelopmentResponse,
} from './dto/tournament-development-response.dto';
import {
  buildKnockoutRounds,
  computeGroupStandings,
  type BracketLike,
  type GroupStandingInput,
  type StandingTeamRef,
} from './tournament-development.rules';

@Injectable()
export class TournamentDevelopmentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentPhase)
    private readonly phaseRepository: Repository<TournamentPhase>,
    @InjectRepository(TournamentGroup)
    private readonly groupRepository: Repository<TournamentGroup>,
    @InjectRepository(TournamentGroupTeam)
    private readonly groupTeamRepository: Repository<TournamentGroupTeam>,
    @InjectRepository(TournamentBracket)
    private readonly bracketRepository: Repository<TournamentBracket>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async getDevelopment(tournamentId: number): Promise<TournamentDevelopmentResponse> {
    const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament #${tournamentId} was not found.`);
    }

    const phases = await this.phaseRepository.find({
      where: { tournamentId },
      order: { phaseOrder: 'ASC', id: 'ASC' },
    });
    const phaseIds = phases.map((phase) => phase.id);

    const groups = phaseIds.length
      ? await this.groupRepository.find({
          where: { phaseId: In(phaseIds) },
          order: { groupOrder: 'ASC', id: 'ASC' },
        })
      : [];
    const groupIds = groups.map((group) => group.id);

    const groupTeams = groupIds.length
      ? await this.groupTeamRepository.find({ where: { groupId: In(groupIds) } })
      : [];

    const brackets = phaseIds.length
      ? await this.bracketRepository.find({
          where: { phaseId: In(phaseIds) },
          order: { bracketOrder: 'ASC', id: 'ASC' },
        })
      : [];

    const matches = await this.matchRepository.find({
      where: { tournamentId },
      order: { startsAt: 'ASC', id: 'ASC' },
    });

    const teamIds = new Set<number>();
    for (const link of groupTeams) teamIds.add(link.teamId);
    for (const bracket of brackets) {
      if (bracket.teamAId != null) teamIds.add(bracket.teamAId);
      if (bracket.teamBId != null) teamIds.add(bracket.teamBId);
      if (bracket.winnerTeamId != null) teamIds.add(bracket.winnerTeamId);
    }
    for (const match of matches) {
      teamIds.add(match.homeTeamId);
      teamIds.add(match.awayTeamId);
    }

    const teams = teamIds.size
      ? await this.teamRepository.find({ where: { id: In([...teamIds]) } })
      : [];
    const teamsById = new Map<number, StandingTeamRef>(
      teams.map((team) => [team.id, { id: team.id, name: team.name, shortName: team.shortName, code: team.code }]),
    );

    const teamIdsByGroup = new Map<number, number[]>();
    for (const link of groupTeams) {
      const list = teamIdsByGroup.get(link.groupId) ?? [];
      list.push(link.teamId);
      teamIdsByGroup.set(link.groupId, list);
    }

    const phaseViews: TournamentDevelopmentPhase[] = phases.map((phase) => {
      const base: TournamentDevelopmentPhase = {
        id: phase.id,
        tournamentId: phase.tournamentId,
        name: phase.name,
        phaseOrder: phase.phaseOrder,
        phaseType: phase.phaseType,
        status: phase.status,
        startDate: phase.startDate,
        endDate: phase.endDate,
      };

      if (phase.phaseType === 'GROUPS') {
        const phaseGroups = groups.filter((group) => group.phaseId === phase.id);
        base.groups = phaseGroups.map((group) => {
          const input: GroupStandingInput = {
            id: group.id,
            name: group.name,
            groupOrder: group.groupOrder,
            maxTeams: group.maxTeams,
            teamIds: teamIdsByGroup.get(group.id) ?? [],
          };
          return computeGroupStandings(input, teamsById, matches);
        });
      } else if (phase.phaseType === 'KNOCKOUT') {
        const phaseBrackets = brackets.filter((bracket) => bracket.phaseId === phase.id) as BracketLike[];
        base.knockoutRounds = buildKnockoutRounds(phaseBrackets, teamsById, matches);
      }

      return base;
    });

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        sportId: tournament.sportId,
        location: tournament.location,
      },
      phases: phaseViews,
    };
  }
}
