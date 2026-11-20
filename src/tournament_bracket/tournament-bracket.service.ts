import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../team/entities/team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { SaveTournamentBracketDto } from './dto/save-tournament-bracket.dto';
import { TournamentBracket } from './entities/tournament-bracket.entity';
import { canDeleteBracket, validBracketTeamWinner } from './tournament-bracket.rules';

@Injectable()
export class TournamentBracketService {
  constructor(
    @InjectRepository(TournamentBracket)
    private readonly bracketRepository: Repository<TournamentBracket>,
    @InjectRepository(TournamentPhase)
    private readonly phaseRepository: Repository<TournamentPhase>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationRepository: Repository<TournamentRegistration>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async list(tournamentId: number, phaseId: number) {
    await this.getPhase(tournamentId, phaseId);
    const brackets = await this.bracketRepository.find({
      where: { phaseId },
      order: { bracketOrder: 'ASC', id: 'ASC' },
    });
    if (brackets.length === 0) return [];

    const teamIds = [...new Set(
      brackets.flatMap((bracket) => [
        bracket.teamAId,
        bracket.teamBId,
        bracket.winnerTeamId,
      ].filter((id): id is number => id != null)),
    )];
    const teams = teamIds.length
      ? await this.teamRepository.findBy({ id: In(teamIds) })
      : [];
    const teamById = new Map(teams.map((team) => [team.id, team]));

    return brackets.map((bracket) => ({
      ...bracket,
      teamA: bracket.teamAId == null ? null : teamById.get(bracket.teamAId) ?? null,
      teamB: bracket.teamBId == null ? null : teamById.get(bracket.teamBId) ?? null,
      winnerTeam: bracket.winnerTeamId == null ? null : teamById.get(bracket.winnerTeamId) ?? null,
    }));
  }

  async generate(tournamentId: number, phaseId: number) {
    const phase = await this.getPhase(tournamentId, phaseId);
    const existing = await this.bracketRepository.count({ where: { phaseId } });
    if (existing > 0) throw new ConflictException('The knockout bracket already exists.');

    const registrations = await this.registrationRepository.find({
      where: { tournamentId, status: 'REGISTERED' },
      order: { registeredAt: 'ASC' },
    });
    const teamIds = registrations.map((item) => item.teamId);
    if (teamIds.length < 2 || (teamIds.length & (teamIds.length - 1)) !== 0) {
      throw new BadRequestException('Generate brackets only with 2, 4, 8 or 16 registered teams.');
    }

    const teams = await this.teamRepository.findBy({ id: In(teamIds) });
    const teamById = new Map(teams.map((team) => [team.id, team]));
    const orderedTeams = teamIds.map((id) => teamById.get(id)).filter((team): team is Team => team != null);

    const roundType = orderedTeams.length === 2
      ? 'FINAL'
      : orderedTeams.length === 4
        ? 'SEMIFINAL'
        : 'QUARTERFINAL';
    const brackets = orderedTeams.reduce<TournamentBracket[]>((result, team, index) => {
      if (index % 2 !== 0) return result;
      const other = orderedTeams[index + 1];
      result.push(this.bracketRepository.create({
        phaseId: phase.id,
        roundType,
        bracketOrder: index / 2 + 1,
        teamAId: team.id,
        teamBId: other?.id ?? null,
        winnerTeamId: null,
        status: 'PENDING',
      }));
      return result;
    }, []);

    await this.bracketRepository.save(brackets);
    return this.list(tournamentId, phaseId);
  }

  async save(tournamentId: number, phaseId: number, dto: SaveTournamentBracketDto) {
    await this.getPhase(tournamentId, phaseId);
    const existing = await this.bracketRepository.findOne({
      where: { phaseId, roundType: dto.roundType, bracketOrder: dto.bracketOrder },
    });
    if (existing) {
      throw new ConflictException('A bracket slot already exists for this round and order.');
    }
    await this.assertTeamIsRegistered(tournamentId, dto.teamAId);
    await this.assertTeamIsRegistered(tournamentId, dto.teamBId);

    if (dto.teamAId != null && dto.teamAId === dto.teamBId) {
      throw new BadRequestException('A team cannot play against itself.');
    }
    if (!validBracketTeamWinner(dto.teamAId ?? null, dto.teamBId ?? null, dto.winnerTeamId ?? null)) {
      throw new BadRequestException('The winner must be one of the teams in the bracket.');
    }

    const bracket = this.bracketRepository.create({
      phaseId,
      roundType: dto.roundType,
      bracketOrder: dto.bracketOrder,
      teamAId: dto.teamAId ?? null,
      teamBId: dto.teamBId ?? null,
      winnerTeamId: dto.winnerTeamId ?? null,
      status: dto.status ?? 'PENDING',
    });
    return this.bracketRepository.save(bracket);
  }

  async setWinner(
    tournamentId: number,
    phaseId: number,
    bracketId: number,
    winnerTeamId: number,
  ) {
    await this.getPhase(tournamentId, phaseId);
    const bracket = await this.getBracket(phaseId, bracketId);
    if (!validBracketTeamWinner(bracket.teamAId, bracket.teamBId, winnerTeamId)) {
      throw new BadRequestException('The winner must be one of the teams in the bracket.');
    }
    await this.assertTeamIsRegistered(tournamentId, winnerTeamId);
    bracket.winnerTeamId = winnerTeamId;
    bracket.status = 'FINISHED';
    return this.bracketRepository.save(bracket);
  }

  async remove(tournamentId: number, phaseId: number, bracketId: number) {
    await this.getPhase(tournamentId, phaseId);
    const bracket = await this.getBracket(phaseId, bracketId);
    if (!canDeleteBracket(bracket.status)) {
      throw new ConflictException('A finished bracket cannot be deleted.');
    }
    await this.bracketRepository.remove(bracket);
    return { message: `Bracket #${bracketId} removed successfully.` };
  }

  private async getPhase(tournamentId: number, phaseId: number): Promise<TournamentPhase> {
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId, tournamentId },
    });
    if (!phase) throw new NotFoundException('The tournament phase was not found.');
    if (phase.phaseType !== 'KNOCKOUT') {
      throw new ConflictException('Knockout brackets require a KNOCKOUT phase.');
    }
    return phase;
  }

  private async getBracket(phaseId: number, bracketId: number): Promise<TournamentBracket> {
    const bracket = await this.bracketRepository.findOne({
      where: { id: bracketId, phaseId },
    });
    if (!bracket) throw new NotFoundException(`Bracket #${bracketId} was not found.`);
    return bracket;
  }

  private async assertTeamIsRegistered(tournamentId: number, teamId: number | null | undefined) {
    if (teamId == null) return;
    const registration = await this.registrationRepository.findOne({
      where: { tournamentId, teamId, status: 'REGISTERED' },
    });
    if (!registration) {
      throw new ConflictException('Each bracket team must be registered in the tournament.');
    }
  }
}
