import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { nameKey } from './catalog.text';
import type { CatalogState, RuleResult } from './catalog.types';
import { Deporte } from './entities/deporte.entity';
import { Equipo } from './entities/equipo.entity';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Habilidad } from './entities/habilidad.entity';
import { Jugador } from './entities/jugador.entity';
import { JugadorHabilidad } from './entities/jugador-habilidad.entity';
import { Vinculacion } from './entities/vinculacion.entity';

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
      manager.find(Deporte, { order: { id: 'ASC' } }),
      manager.find(Equipo, { order: { id: 'ASC' } }),
      manager.find(EquipoDeporte, { order: { id: 'ASC' } }),
      manager.find(Jugador, { order: { id: 'ASC' } }),
      manager.find(Vinculacion, { order: { id: 'ASC' } }),
      manager.find(Habilidad, { order: { id: 'ASC' } }),
      manager.find(JugadorHabilidad, { order: { id: 'ASC' } }),
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
      teamSports: teamSports.map((link) => ({ teamId: link.equipoId, sportId: link.deporteId })),
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
        playerId: contract.jugadorId,
        teamId: contract.equipoId,
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
        playerId: link.jugadorId,
        skillId: link.habilidadId,
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
        throw new ConflictException('Ya existe un registro con esos datos.');
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
    await manager.createQueryBuilder().update(Vinculacion).set({ activePlayerKey: null }).execute();
    await this.deleteMissing(manager, Vinculacion, state.contracts.map((contract) => contract.id));
    const contracts = await this.persistContracts(manager, state, players, teams);
    await manager.createQueryBuilder().delete().from(EquipoDeporte).execute();
    await manager.createQueryBuilder().delete().from(JugadorHabilidad).execute();
    if (state.teamSports.length) {
      await manager.save(
        EquipoDeporte,
        state.teamSports.map((link) =>
          manager.create(EquipoDeporte, {
            equipoId: teams.get(link.teamId) ?? link.teamId,
            deporteId: sports.get(link.sportId) ?? link.sportId,
          }),
        ),
      );
    }
    if (state.playerSkills.length) {
      await manager.save(
        JugadorHabilidad,
        state.playerSkills.map((link) =>
          manager.create(JugadorHabilidad, {
            jugadorId: players.get(link.playerId) ?? link.playerId,
            habilidadId: skills.get(link.skillId) ?? link.skillId,
            score: link.score,
          }),
        ),
      );
    }
    await this.deleteMissing(manager, Jugador, [...players.values()]);
    await this.deleteMissing(manager, Habilidad, [...skills.values()]);
    await this.deleteMissing(manager, Equipo, [...teams.values()]);
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
        await manager.save(Deporte, { id: sport.id, ...payload });
        map.set(sport.id, sport.id);
        return;
      }
      const saved = await manager.save(manager.create(Deporte, payload));
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
        await manager.save(Equipo, { id: team.id, ...payload });
        map.set(team.id, team.id);
      } else {
        const saved = await manager.save(manager.create(Equipo, payload));
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
        await manager.save(Habilidad, { id: skill.id, ...payload });
        map.set(skill.id, skill.id);
      } else {
        const saved = await manager.save(manager.create(Habilidad, payload));
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
        await manager.save(Jugador, { id: player.id, ...payload });
        map.set(player.id, player.id);
      } else {
        const saved = await manager.save(manager.create(Jugador, payload));
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
    const ordered = [...state.contracts].sort((left, right) => Number(right.status !== 'activo') - Number(left.status !== 'activo'));
    for (const contract of ordered) {
      const jugadorId = players.get(contract.playerId) ?? contract.playerId;
      const payload = {
        jugadorId,
        equipoId: teams.get(contract.teamId) ?? contract.teamId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        endReason: contract.endReason,
        detail: contract.detail,
        activePlayerKey: contract.status === 'activo' ? jugadorId : null,
      };
      if (contract.id > 0) {
        await manager.save(Vinculacion, { id: contract.id, ...payload });
        map.set(contract.id, contract.id);
      } else {
        const saved = await manager.save(manager.create(Vinculacion, payload));
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
      .from(Deporte)
      .where('parent_id IS NOT NULL');
    const removeParents = manager.createQueryBuilder().delete().from(Deporte).where('parent_id IS NULL');
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
