import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { nameKey } from './catalog.text';
import type { CatalogState, RuleResult } from './catalog.types';
import { Sport } from '../sport/entities/sport.entity';
import { Team } from '../team/entities/team.entity';
import { TeamSport } from '../team_sport/entities/team-sport.entity';
import { Skill } from '../skill/entities/skill.entity';
import { Player } from '../player/entities/player.entity';
import { PlayerSkill } from '../player_skill/entities/player-skill.entity';
import { Contract } from '../contract/entities/contract.entity';

type IdMaps = {
  sports: Map<number, number>;
  teams: Map<number, number>;
  players: Map<number, number>;
  skills: Map<number, number>;
  contracts: Map<number, number>;
};

@Injectable()
export class CatalogStore {
  constructor(private readonly dataSource: DataSource) {}

  async load(manager: EntityManager = this.dataSource.manager): Promise<CatalogState> {
    const [sports, teams, teamSports, players, contracts, skills, playerSkills] = await Promise.all([
      manager.find(Sport, { order: { id: 'ASC' } }),
      manager.find(Team, { order: { id: 'ASC' } }),
      manager.find(TeamSport, { order: { id: 'ASC' } }),
      manager.find(Player, { order: { id: 'ASC' } }),
      manager.find(Contract, { order: { id: 'ASC' } }),
      manager.find(Skill, { order: { id: 'ASC' } }),
      manager.find(PlayerSkill, { order: { id: 'ASC' } }),
    ]);

    return {
      sports: sports.map((sport) => ({
        id: sport.id,
        code: sport.code,
        name: sport.name,
        category: sport.category,
        description: sport.description,
        status: sport.status as CatalogState['sports'][number]['status'],
        parentId: sport.parentId,
        createdAt: sport.createdAt,
      })),
      teams: teams.map((team) => ({
        id: team.id,
        code: team.code,
        name: team.name,
        shortName: team.shortName,
        city: team.city,
        description: team.description,
        status: team.status as CatalogState['teams'][number]['status'],
        createdAt: team.createdAt,
        color: team.color,
      })),
      teamSports: teamSports.map((link) => ({ teamId: link.teamId, sportId: link.sportId })),
      players: players.map((player) => ({
        id: player.id,
        fullName: player.fullName,
        document: player.document,
        age: player.age,
        nationality: player.nationality,
        position: player.position,
        heightM: Number(player.heightM),
        dominantFoot: player.dominantFoot,
        status: player.status as CatalogState['players'][number]['status'],
        email: player.email,
        phone: player.phone,
        preferredSportId: player.preferredSportId,
        stats: {
          matches: player.matches,
          goals: player.goals,
          assists: player.assists,
          rating: Number(player.rating),
        },
      })),
      contracts: contracts.map((contract) => ({
        id: contract.id,
        playerId: contract.playerId,
        teamId: contract.teamId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status as CatalogState['contracts'][number]['status'],
        endReason: contract.endReason,
        detail: contract.detail,
      })),
      skills: skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category as CatalogState['skills'][number]['category'],
        description: skill.description,
        glyph: skill.glyph,
      })),
      playerSkills: playerSkills.map((link) => ({
        playerId: link.playerId,
        skillId: link.skillId,
        score: link.score,
      })),
    };
  }

  async mutate(change: (state: CatalogState) => RuleResult): Promise<{ message: string; id?: number }> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const current = await this.load(manager);
        const result = change(current);
        if (!result.ok) {
          if (result.status === 404) throw new NotFoundException(result.message);
          if (result.status === 409) throw new ConflictException(result.message);
          throw new BadRequestException(result.message);
        }
        const maps = await this.persist(manager, result.state);
        return { message: result.message, id: this.resolve(result.id, maps) };
      });
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new ConflictException('A record with those values already exists.');
      }
      throw error;
    }
  }

  private resolve(id: number | undefined, maps: IdMaps): number | undefined {
    if (id == null) return undefined;
    if (id > 0) return id;
    return (
      maps.sports.get(id) ??
      maps.teams.get(id) ??
      maps.players.get(id) ??
      maps.skills.get(id) ??
      maps.contracts.get(id)
    );
  }

  private async persist(manager: EntityManager, state: CatalogState): Promise<IdMaps> {
    const sports = await this.persistSports(manager, state);
    const teams = await this.persistTeams(manager, state);
    const skills = await this.persistSkills(manager, state);
    const players = await this.persistPlayers(manager, state, sports);
    await manager.createQueryBuilder().update(Contract).set({ activePlayerKey: null }).execute();
    await this.deleteMissing(manager, Contract, state.contracts.map((contract) => contract.id));
    const contracts = await this.persistContracts(manager, state, players, teams);
    await manager.createQueryBuilder().delete().from(TeamSport).execute();
    await manager.createQueryBuilder().delete().from(PlayerSkill).execute();
    if (state.teamSports.length) {
      await manager.save(
        TeamSport,
        state.teamSports.map((link) =>
          manager.create(TeamSport, {
            teamId: teams.get(link.teamId) ?? link.teamId,
            sportId: sports.get(link.sportId) ?? link.sportId,
          }),
        ),
      );
    }
    if (state.playerSkills.length) {
      await manager.save(
        PlayerSkill,
        state.playerSkills.map((link) =>
          manager.create(PlayerSkill, {
            playerId: players.get(link.playerId) ?? link.playerId,
            skillId: skills.get(link.skillId) ?? link.skillId,
            score: link.score,
          }),
        ),
      );
    }
    await this.deleteMissing(manager, Player, [...players.values()]);
    await this.deleteMissing(manager, Skill, [...skills.values()]);
    await this.deleteMissing(manager, Team, [...teams.values()]);
    await this.deleteSports(manager, [...sports.values()]);
    return { sports, teams, players, skills, contracts };
  }

  private async persistSports(manager: EntityManager, state: CatalogState): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    const save = async (sport: CatalogState['sports'][number], parentId: number | null) => {
      const payload = {
        code: sport.code,
        name: sport.name,
        nameKey: nameKey(sport.name),
        category: sport.category,
        description: sport.description,
        status: sport.status,
        parentId,
        createdAt: sport.createdAt,
      };
      if (sport.id > 0) {
        await manager.save(Sport, { id: sport.id, ...payload });
        map.set(sport.id, sport.id);
        return;
      }
      const saved = await manager.save(manager.create(Sport, payload));
      map.set(sport.id, saved.id);
    };
    for (const sport of state.sports.filter((item) => item.parentId == null)) {
      await save(sport, null);
    }
    for (const sport of state.sports.filter((item) => item.parentId != null)) {
      await save(sport, map.get(sport.parentId!) ?? sport.parentId);
    }
    return map;
  }

  private async persistTeams(manager: EntityManager, state: CatalogState): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    for (const team of state.teams) {
      const payload = {
        code: team.code,
        name: team.name,
        nameKey: nameKey(team.name),
        shortName: team.shortName,
        city: team.city,
        description: team.description,
        status: team.status,
        createdAt: team.createdAt,
        color: team.color,
      };
      if (team.id > 0) {
        await manager.save(Team, { id: team.id, ...payload });
        map.set(team.id, team.id);
      } else {
        const saved = await manager.save(manager.create(Team, payload));
        map.set(team.id, saved.id);
      }
    }
    return map;
  }

  private async persistSkills(manager: EntityManager, state: CatalogState): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    for (const skill of state.skills) {
      const payload = {
        name: skill.name,
        nameKey: nameKey(skill.name),
        category: skill.category,
        description: skill.description,
        glyph: skill.glyph,
      };
      if (skill.id > 0) {
        await manager.save(Skill, { id: skill.id, ...payload });
        map.set(skill.id, skill.id);
      } else {
        const saved = await manager.save(manager.create(Skill, payload));
        map.set(skill.id, saved.id);
      }
    }
    return map;
  }

  private async persistPlayers(
    manager: EntityManager,
    state: CatalogState,
    sports: Map<number, number>,
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    for (const player of state.players) {
      const preferred =
        player.preferredSportId == null ? null : (sports.get(player.preferredSportId) ?? player.preferredSportId);
      const payload = {
        fullName: player.fullName,
        document: player.document,
        documentKey: nameKey(player.document),
        age: player.age,
        nationality: player.nationality,
        position: player.position,
        heightM: player.heightM,
        dominantFoot: player.dominantFoot,
        status: player.status,
        email: player.email,
        phone: player.phone,
        preferredSportId: preferred,
        matches: player.stats.matches,
        goals: player.stats.goals,
        assists: player.stats.assists,
        rating: player.stats.rating,
      };
      if (player.id > 0) {
        await manager.save(Player, { id: player.id, ...payload });
        map.set(player.id, player.id);
      } else {
        const saved = await manager.save(manager.create(Player, payload));
        map.set(player.id, saved.id);
      }
    }
    return map;
  }

  private async persistContracts(
    manager: EntityManager,
    state: CatalogState,
    players: Map<number, number>,
    teams: Map<number, number>,
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    const ordered = [...state.contracts].sort((left, right) => Number(right.status !== 'active') - Number(left.status !== 'active'));
    for (const contract of ordered) {
      const playerId = players.get(contract.playerId) ?? contract.playerId;
      const payload = {
        playerId,
        teamId: teams.get(contract.teamId) ?? contract.teamId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        endReason: contract.endReason,
        detail: contract.detail,
        activePlayerKey: contract.status === 'active' ? playerId : null,
      };
      if (contract.id > 0) {
        await manager.save(Contract, { id: contract.id, ...payload });
        map.set(contract.id, contract.id);
      } else {
        const saved = await manager.save(manager.create(Contract, payload));
        map.set(contract.id, saved.id);
      }
    }
    return map;
  }

  private async deleteMissing(manager: EntityManager, entity: { new (): object }, keep: number[]) {
    const positive = keep.filter((id) => id > 0);
    if (positive.length === 0) {
      await manager.createQueryBuilder().delete().from(entity).execute();
      return;
    }
    await manager.createQueryBuilder().delete().from(entity).where('id NOT IN (:...ids)', { ids: positive }).execute();
  }

  private async deleteSports(manager: EntityManager, keep: number[]) {
    const positive = keep.filter((id) => id > 0);
    const removeChildren = manager
      .createQueryBuilder()
      .delete()
      .from(Sport)
      .where('parent_id IS NOT NULL');
    const removeParents = manager.createQueryBuilder().delete().from(Sport).where('parent_id IS NULL');
    if (positive.length === 0) {
      await removeChildren.execute();
      await removeParents.execute();
      return;
    }
    await removeChildren.andWhere('id NOT IN (:...ids)', { ids: positive }).execute();
    await removeParents.andWhere('id NOT IN (:...ids)', { ids: positive }).execute();
  }

  private isDuplicate(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
