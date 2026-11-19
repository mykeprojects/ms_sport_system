import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../team/entities/team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { SaveTournamentGroupDto } from './dto/save-tournament-group.dto';
import { TournamentGroupTeam } from './entities/tournament-group-team.entity';
import { TournamentGroup } from './entities/tournament-group.entity';
import { canAssignTeam, groupNameKey, normalizeGroupName } from './tournament-group.rules';

@Injectable()
export class TournamentGroupService {
  constructor(
    @InjectRepository(TournamentGroup)
    private readonly groupRepository: Repository<TournamentGroup>,
    @InjectRepository(TournamentGroupTeam)
    private readonly groupTeamRepository: Repository<TournamentGroupTeam>,
    @InjectRepository(TournamentPhase)
    private readonly phaseRepository: Repository<TournamentPhase>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationRepository: Repository<TournamentRegistration>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async list(tournamentId: number, phaseId: number) {
    const phase = await this.getPhase(tournamentId, phaseId);
    const groups = await this.groupRepository.find({
      where: { phaseId: phase.id },
      order: { groupOrder: 'ASC', id: 'ASC' },
    });
    if (groups.length === 0) return [];

    const links = await this.groupTeamRepository.find({
      where: groups.map((group) => ({ groupId: group.id })),
    });
    const teamIds = [...new Set(links.map((link) => link.teamId))];
    const teams =
      teamIds.length === 0
        ? []
        : await this.teamRepository.findBy({ id: In(teamIds) });
    const teamById = new Map(teams.map((team) => [team.id, team]));

    return groups.map((group) => ({
      ...group,
      teams: links
        .filter((link) => link.groupId === group.id)
        .map((link) => teamById.get(link.teamId))
        .filter((team): team is Team => team != null)
        .map((team) => ({
          id: team.id,
          code: team.code,
          name: team.name,
          shortName: team.shortName,
          city: team.city,
          status: team.status,
        })),
    }));
  }

  async create(tournamentId: number, phaseId: number, dto: SaveTournamentGroupDto) {
    await this.getPhase(tournamentId, phaseId);
    const name = normalizeGroupName(dto.name);
    const nameKey = groupNameKey(name);
    await this.assertUnique(phaseId, nameKey, dto.groupOrder);

    const group = this.groupRepository.create({
      phaseId,
      name,
      nameKey,
      groupOrder: dto.groupOrder,
      maxTeams: dto.maxTeams ?? null,
    });
    try {
      return await this.groupRepository.save(group);
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async update(
    tournamentId: number,
    phaseId: number,
    groupId: number,
    dto: SaveTournamentGroupDto,
  ) {
    await this.getPhase(tournamentId, phaseId);
    const group = await this.getGroup(phaseId, groupId);
    const name = normalizeGroupName(dto.name);
    const nameKey = groupNameKey(name);
    await this.assertUnique(phaseId, nameKey, dto.groupOrder, group.id);

    group.name = name;
    group.nameKey = nameKey;
    group.groupOrder = dto.groupOrder;
    group.maxTeams = dto.maxTeams ?? null;
    try {
      return await this.groupRepository.save(group);
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async remove(tournamentId: number, phaseId: number, groupId: number) {
    await this.getPhase(tournamentId, phaseId);
    const group = await this.getGroup(phaseId, groupId);
    await this.groupTeamRepository.delete({ groupId });
    await this.groupRepository.remove(group);
    return { message: `Group #${groupId} removed successfully.` };
  }

  async assignTeam(
    tournamentId: number,
    phaseId: number,
    groupId: number,
    teamId: number,
  ) {
    const phase = await this.getPhase(tournamentId, phaseId);
    const group = await this.getGroup(phaseId, groupId);
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('The selected team does not exist.');

    const registration = await this.registrationRepository.findOne({
      where: {
        tournamentId,
        teamId,
        status: 'REGISTERED',
      },
    });
    if (!registration) {
      throw new ConflictException('The team must be registered in the tournament.');
    }

    const alreadyAssigned = await this.groupTeamRepository.findOne({
      where: { groupId, teamId },
    });
    if (alreadyAssigned) {
      throw new ConflictException('This team is already assigned to the group.');
    }

    const assignedCount = await this.groupTeamRepository.count({ where: { groupId } });
    if (!canAssignTeam(group.maxTeams, assignedCount)) {
      throw new ConflictException('The group has reached its maximum team capacity.');
    }

    await this.groupTeamRepository.save(
      this.groupTeamRepository.create({ groupId: group.id, teamId }),
    );
    return { message: `${team.name} was assigned to ${group.name}.` };
  }

  async removeTeam(
    tournamentId: number,
    phaseId: number,
    groupId: number,
    teamId: number,
  ) {
    await this.getPhase(tournamentId, phaseId);
    await this.getGroup(phaseId, groupId);
    const link = await this.groupTeamRepository.findOne({
      where: { groupId, teamId },
    });
    if (!link) throw new NotFoundException('The team is not assigned to this group.');
    await this.groupTeamRepository.remove(link);
    return { message: 'The team was removed from the group.' };
  }

  private async getPhase(tournamentId: number, phaseId: number): Promise<TournamentPhase> {
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId, tournamentId },
    });
    if (!phase) throw new NotFoundException('The tournament phase was not found.');
    if (phase.phaseType !== 'GROUPS') {
      throw new ConflictException('Groups can only be managed in a GROUPS phase.');
    }
    return phase;
  }

  private async getGroup(phaseId: number, groupId: number): Promise<TournamentGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, phaseId },
    });
    if (!group) throw new NotFoundException(`Group #${groupId} was not found.`);
    return group;
  }

  private async assertUnique(
    phaseId: number,
    nameKey: string,
    groupOrder: number,
    ignoreId?: number,
  ) {
    const nameDuplicate = await this.groupRepository.findOne({
      where: { phaseId, nameKey },
    });
    if (nameDuplicate && nameDuplicate.id !== ignoreId) {
      throw new ConflictException('A group with this name already exists in the phase.');
    }
    const orderDuplicate = await this.groupRepository.findOne({
      where: { phaseId, groupOrder },
    });
    if (orderDuplicate && orderDuplicate.id !== ignoreId) {
      throw new ConflictException('A group already uses this order in the phase.');
    }
  }

  private mapDatabaseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      String((error as { code?: string }).code) === 'ER_DUP_ENTRY'
    ) {
      throw new ConflictException('The group name or order conflicts with another group.');
    }
    throw error;
  }
}
