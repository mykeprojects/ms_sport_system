import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  buildPerfil,
  buildPlantilla,
  listDeportes,
  listEquipos,
  listHabilidades,
  listJugadores,
  toPlayer,
  toSport,
  toTeam,
} from './catalog.queries';
import {
  assignContract,
  assignSkill,
  associateSport,
  deletePlayer,
  deleteSkill,
  deleteSport,
  deleteTeam,
  releasePlayer,
  removePlayerSkill,
  removeSportAssociation,
  savePlayer,
  saveSkill,
  saveSport,
  saveTeam,
  updateContract,
} from './catalog.rules';
import { CatalogStore } from './catalog.store';
import type { SaveDeporteDto, SaveEquipoDto, SaveHabilidadDto, SaveJugadorDto } from './catalog.dto';
import type { CatalogState, Status } from './catalog.types';

@Injectable()
export class CatalogService {
  constructor(private readonly store: CatalogStore) {}

  async listDeportes(q?: string, status?: string, soloPadres?: string) {
    this.assertStatus(status);
    const state = await this.store.load();
    return listDeportes(state, { q, status, soloPadres: soloPadres === 'true' });
  }

  async getDeporte(id: number) {
    const state = await this.store.load();
    return this.sportOrThrow(state, id);
  }

  async createDeporte(dto: SaveDeporteDto) {
    const saved = await this.store.mutate((state) => saveSport(state, this.sportInput(dto)));
    const state = await this.store.load();
    return { message: saved.message, deporte: this.sportOrThrow(state, saved.id!) };
  }

  async updateDeporte(id: number, dto: SaveDeporteDto) {
    const saved = await this.store.mutate((state) => saveSport(state, this.sportInput(dto, id)));
    const state = await this.store.load();
    return { message: saved.message, deporte: this.sportOrThrow(state, saved.id!) };
  }

  async removeDeporte(id: number) {
    const saved = await this.store.mutate((state) => deleteSport(state, id));
    return { message: saved.message };
  }

  async listEquipos(q?: string, status?: string, deporteId?: string) {
    this.assertStatus(status);
    const state = await this.store.load();
    return listEquipos(state, { q, status, deporteId: this.optionalId(deporteId) });
  }

  async getEquipo(id: number) {
    const state = await this.store.load();
    return this.teamOrThrow(state, id);
  }

  async createEquipo(dto: SaveEquipoDto) {
    const saved = await this.store.mutate((state) => saveTeam(state, { ...dto, description: dto.description ?? '' }));
    const state = await this.store.load();
    return { message: saved.message, equipo: this.teamOrThrow(state, saved.id!) };
  }

  async updateEquipo(id: number, dto: SaveEquipoDto) {
    const saved = await this.store.mutate((state) =>
      saveTeam(state, { ...dto, id, description: dto.description ?? '' }),
    );
    const state = await this.store.load();
    return { message: saved.message, equipo: this.teamOrThrow(state, saved.id!) };
  }

  async removeEquipo(id: number) {
    const saved = await this.store.mutate((state) => deleteTeam(state, id));
    return { message: saved.message };
  }

  async listAsociaciones(teamId: number) {
    const team = await this.getEquipo(teamId);
    return team.deportes;
  }

  async associate(teamId: number, deporteId: number) {
    const saved = await this.store.mutate((state) => associateSport(state, teamId, deporteId));
    const state = await this.store.load();
    return { message: saved.message, deportes: this.teamOrThrow(state, teamId).deportes };
  }

  async removeAssociation(teamId: number, deporteId: number) {
    const saved = await this.store.mutate((state) => removeSportAssociation(state, teamId, deporteId));
    const state = await this.store.load();
    return { message: saved.message, deportes: this.teamOrThrow(state, teamId).deportes };
  }

  async plantilla(teamId: number) {
    const state = await this.store.load();
    const roster = buildPlantilla(state, teamId);
    if (!roster) throw new NotFoundException('No se encontró el equipo.');
    return roster;
  }

  async assignToTeam(teamId: number, jugadorId: number, startDate: string, endDate: string) {
    const saved = await this.store.mutate((state) => assignContract(state, { playerId: jugadorId, teamId, startDate, endDate }));
    return { message: saved.message, plantilla: await this.plantilla(teamId) };
  }

  async updateVinculacion(id: number, startDate: string, endDate: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('No se encontró la vinculación.');
    const saved = await this.store.mutate((state) => updateContract(state, id, startDate, endDate));
    return { message: saved.message, plantilla: await this.plantilla(current.teamId) };
  }

  async release(id: number, reason?: string, detail?: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('No se encontró la vinculación.');
    const saved = await this.store.mutate((state) => releasePlayer(state, id, reason ?? '', detail ?? ''));
    return { message: saved.message, plantilla: await this.plantilla(current.teamId) };
  }

  async listJugadores(q?: string, status?: string, equipoId?: string, deporteId?: string) {
    this.assertStatus(status);
    const state = await this.store.load();
    return listJugadores(state, {
      q,
      status,
      equipoId: this.optionalId(equipoId),
      deporteId: this.optionalId(deporteId),
    });
  }

  async getJugador(id: number) {
    const state = await this.store.load();
    return this.playerOrThrow(state, id);
  }

  async createJugador(dto: SaveJugadorDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, {
        ...this.playerInput(dto),
        teamId: dto.teamId ?? null,
        syncTeam: true,
      }),
    );
    const state = await this.store.load();
    return { message: saved.message, jugador: this.playerOrThrow(state, saved.id!) };
  }

  async updateJugador(id: number, dto: SaveJugadorDto) {
    const saved = await this.store.mutate((state) =>
      savePlayer(state, {
        ...this.playerInput(dto),
        id,
        teamId: dto.teamId,
        syncTeam: dto.teamId !== undefined,
      }),
    );
    const state = await this.store.load();
    return { message: saved.message, jugador: this.playerOrThrow(state, saved.id!) };
  }

  async removeJugador(id: number) {
    const saved = await this.store.mutate((state) => deletePlayer(state, id));
    return { message: saved.message };
  }

  async perfil(id: number) {
    const state = await this.store.load();
    const profile = buildPerfil(state, id);
    if (!profile) throw new NotFoundException('No se encontró el jugador.');
    return profile;
  }

  async listHabilidades(q?: string, category?: string) {
    const state = await this.store.load();
    return listHabilidades(state, { q, category });
  }

  async getHabilidad(id: number) {
    const state = await this.store.load();
    const skill = listHabilidades(state, {}).find((item) => item.id === id);
    if (!skill) throw new NotFoundException('No se encontró la habilidad.');
    return skill;
  }

  async createHabilidad(dto: SaveHabilidadDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, dto));
    return { message: saved.message, habilidad: await this.getHabilidad(saved.id!) };
  }

  async updateHabilidad(id: number, dto: SaveHabilidadDto) {
    const saved = await this.store.mutate((state) => saveSkill(state, { ...dto, id }));
    return { message: saved.message, habilidad: await this.getHabilidad(saved.id!) };
  }

  async removeHabilidad(id: number) {
    const saved = await this.store.mutate((state) => deleteSkill(state, id));
    return { message: saved.message };
  }

  async assignHabilidad(playerId: number, habilidadId: number) {
    const saved = await this.store.mutate((state) => assignSkill(state, playerId, habilidadId));
    const profile = await this.perfil(playerId);
    return { message: saved.message, habilidades: profile.habilidades, media: profile.media };
  }

  async removeHabilidadJugador(playerId: number, habilidadId: number) {
    const saved = await this.store.mutate((state) => removePlayerSkill(state, playerId, habilidadId));
    const profile = await this.perfil(playerId);
    return { message: saved.message, habilidades: profile.habilidades, media: profile.media };
  }

  private sportInput(dto: SaveDeporteDto, id?: number) {
    return {
      id,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? '',
      status: dto.status,
      subdeportes: dto.subdeportes ?? [],
    };
  }

  private playerInput(dto: SaveJugadorDto) {
    return {
      fullName: dto.fullName,
      document: dto.document,
      age: dto.age,
      nationality: dto.nationality,
      position: dto.position,
      heightM: dto.heightM,
      dominantFoot: dto.dominantFoot,
      status: dto.status,
      email: dto.email ?? '',
      phone: dto.phone ?? '',
      preferredSportId: dto.preferredSportId,
    };
  }

  private sportOrThrow(state: CatalogState, id: number) {
    const sport = state.sports.find((item) => item.id === id);
    if (!sport) throw new NotFoundException('No se encontró el deporte.');
    return toSport(state, sport);
  }

  private teamOrThrow(state: CatalogState, id: number) {
    const team = state.teams.find((item) => item.id === id);
    if (!team) throw new NotFoundException('No se encontró el equipo.');
    return toTeam(state, team);
  }

  private playerOrThrow(state: CatalogState, id: number) {
    const player = state.players.find((item) => item.id === id);
    if (!player) throw new NotFoundException('No se encontró el jugador.');
    return toPlayer(state, player);
  }

  private optionalId(value?: string): number | undefined {
    if (value == null || value === '') return undefined;
    const id = Number(value);
    if (!Number.isInteger(id)) throw new BadRequestException('El identificador no es válido.');
    return id;
  }

  private assertStatus(status?: string): asserts status is Status | undefined {
    if (status != null && status !== '' && status !== 'activo' && status !== 'inactivo') {
      throw new BadRequestException('El estado debe ser activo o inactivo.');
    }
  }
}
