import type { CatalogState, ContractRecord, PlayerRecord, SportRecord, TeamRecord } from './catalog.types';
import { sameName } from './catalog.text';

export type SportView = SportRecord & { subdeportes: string[] };
export type TeamView = TeamRecord & {
  deportes: { id: number; name: string; parentId: number | null }[];
  jugadores: number;
};
export type PlayerView = PlayerRecord & {
  equipoActual: { id: number; name: string } | null;
};
export type SkillView = CatalogState['skills'][number] & { jugadores: number };

const RADAR_ALIASES: Record<string, string[]> = {
  Velocidad: ['velocidad'],
  Tiro: ['definición', 'definicion', 'tiro'],
  Pase: ['pase'],
  Defensa: ['defensa'],
  Regate: ['regate'],
  Físico: ['resistencia', 'físico', 'fisico'],
};

function includesText(value: string, query: string): boolean {
  return value.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
}

export function sportFamily(state: CatalogState, deporteId: number): number[] {
  const sport = state.sports.find((item) => item.id === deporteId);
  if (!sport) return [deporteId];
  if (sport.parentId == null) {
    return [sport.id, ...state.sports.filter((item) => item.parentId === sport.id).map((item) => item.id)];
  }
  return [sport.id];
}

export function toSport(state: CatalogState, sport: SportRecord): SportView {
  return {
    ...sport,
    subdeportes:
      sport.parentId == null
        ? state.sports.filter((item) => item.parentId === sport.id).map((item) => item.name)
        : [],
  };
}

export function listDeportes(
  state: CatalogState,
  filters: { q?: string; status?: string; soloPadres?: boolean },
): SportView[] {
  return state.sports
    .filter((sport) => (filters.soloPadres ? sport.parentId == null : true))
    .filter((sport) => (filters.status ? sport.status === filters.status : true))
    .filter((sport) => (filters.q ? includesText(sport.name, filters.q) || includesText(sport.category, filters.q) : true))
    .map((sport) => toSport(state, sport));
}

export function listEquipos(
  state: CatalogState,
  filters: { q?: string; status?: string; deporteId?: number },
): TeamView[] {
  const family = filters.deporteId == null ? null : new Set(sportFamily(state, filters.deporteId));
  return state.teams
    .filter((team) => (filters.status ? team.status === filters.status : true))
    .filter((team) =>
      filters.q ? includesText(team.name, filters.q) || includesText(team.city, filters.q) : true,
    )
    .filter((team) =>
      family
        ? state.teamSports.some((link) => link.teamId === team.id && family.has(link.sportId))
        : true,
    )
    .map((team) => toTeam(state, team));
}

export function toTeam(state: CatalogState, team: TeamRecord): TeamView {
  return {
    ...team,
    deportes: state.teamSports
      .filter((link) => link.teamId === team.id)
      .map((link) => state.sports.find((sport) => sport.id === link.sportId))
      .filter((sport): sport is SportRecord => Boolean(sport))
      .map((sport) => ({ id: sport.id, name: sport.name, parentId: sport.parentId })),
    jugadores: state.contracts.filter((contract) => contract.teamId === team.id && contract.status === 'activo').length,
  };
}

function currentTeam(state: CatalogState, playerId: number): { id: number; name: string } | null {
  const active = state.contracts.find((contract) => contract.playerId === playerId && contract.status === 'activo');
  if (!active) return null;
  const team = state.teams.find((item) => item.id === active.teamId);
  return team ? { id: team.id, name: team.name } : null;
}

export function toPlayer(state: CatalogState, player: PlayerRecord): PlayerView {
  return { ...player, equipoActual: currentTeam(state, player.id) };
}

export function listJugadores(
  state: CatalogState,
  filters: { q?: string; status?: string; equipoId?: number; deporteId?: number },
): PlayerView[] {
  const family = filters.deporteId == null ? null : new Set(sportFamily(state, filters.deporteId));
  return state.players
    .filter((player) => (filters.status ? player.status === filters.status : true))
    .filter((player) =>
      filters.q ? includesText(player.fullName, filters.q) || includesText(player.document, filters.q) : true,
    )
    .filter((player) => {
      if (filters.equipoId == null) return true;
      return state.contracts.some(
        (contract) =>
          contract.playerId === player.id && contract.teamId === filters.equipoId && contract.status === 'activo',
      );
    })
    .filter((player) => {
      if (!family) return true;
      if (player.preferredSportId != null && family.has(player.preferredSportId)) return true;
      const active = state.contracts.find((contract) => contract.playerId === player.id && contract.status === 'activo');
      if (!active) return false;
      return state.teamSports.some((link) => link.teamId === active.teamId && family.has(link.sportId));
    })
    .map((player) => toPlayer(state, player));
}

export function listHabilidades(state: CatalogState, filters: { q?: string; category?: string }): SkillView[] {
  return state.skills
    .filter((skill) => (filters.category ? sameName(skill.category, filters.category) : true))
    .filter((skill) => (filters.q ? includesText(skill.name, filters.q) : true))
    .map((skill) => ({
      ...skill,
      jugadores: state.playerSkills.filter((link) => link.skillId === skill.id).length,
    }));
}

function contractView(state: CatalogState, contract: ContractRecord) {
  const player = state.players.find((item) => item.id === contract.playerId);
  const team = state.teams.find((item) => item.id === contract.teamId);
  return {
    ...contract,
    jugador: player
      ? { id: player.id, fullName: player.fullName, position: player.position, document: player.document, status: player.status }
      : null,
    equipo: team ? { id: team.id, name: team.name } : null,
  };
}

export function buildPlantilla(state: CatalogState, teamId: number) {
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return null;
  const contracts = state.contracts.filter((contract) => contract.teamId === teamId).map((contract) => contractView(state, contract));
  return {
    equipo: toTeam(state, team),
    actuales: contracts.filter((contract) => contract.status === 'activo'),
    historial: contracts.filter((contract) => contract.status !== 'activo'),
  };
}

export function buildPerfil(state: CatalogState, playerId: number) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return null;
  const contracts = state.contracts
    .filter((contract) => contract.playerId === playerId)
    .map((contract) => contractView(state, contract));
  const habilidades = state.playerSkills
    .filter((link) => link.playerId === playerId)
    .map((link) => {
      const skill = state.skills.find((item) => item.id === link.skillId);
      return skill ? { ...skill, score: link.score } : null;
    })
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));
  const media = habilidades.length
    ? Math.round(habilidades.reduce((total, skill) => total + skill.score, 0) / habilidades.length)
    : null;
  const radar = Object.entries(RADAR_ALIASES).map(([axis, aliases]) => {
    const skill = habilidades.find((item) =>
      aliases.some((alias) => item.name.toLocaleLowerCase('es') === alias.toLocaleLowerCase('es')),
    );
    return { axis, score: skill?.score ?? null };
  });
  return {
    jugador: toPlayer(state, player),
    vinculacionActual: contracts.find((contract) => contract.status === 'activo') ?? null,
    historial: contracts.filter((contract) => contract.status !== 'activo'),
    habilidades,
    media,
    radar,
    mensajes: {
      equipos: contracts.length === 0 ? 'Este jugador no tiene equipos asociados.' : null,
      habilidades: habilidades.length === 0 ? 'Este jugador no tiene habilidades registradas.' : null,
    },
  };
}
