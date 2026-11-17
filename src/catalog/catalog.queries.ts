import type { CatalogState, ContractRecord, PlayerRecord, SportRecord, TeamRecord } from './catalog.types';
import { sameName } from './catalog.text';

export type SportView = SportRecord & { subsports: string[] };
export type TeamView = TeamRecord & {
  sports: { id: number; name: string; parentId: number | null }[];
  players: number;
};
export type PlayerView = PlayerRecord & {
  currentTeam: { id: number; name: string } | null;
};
export type SkillView = CatalogState['skills'][number] & { players: number };

const RADAR_ALIASES: Record<string, string[]> = {
  Speed: ['velocidad'],
  Shooting: ['definición', 'definicion', 'tiro'],
  Passing: ['pase'],
  Defense: ['defensa'],
  Dribbling: ['regate'],
  Physical: ['resistencia', 'físico', 'fisico'],
};

function includesText(value: string, query: string): boolean {
  return value.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
}

export function sportFamily(state: CatalogState, sportId: number): number[] {
  const sport = state.sports.find((item) => item.id === sportId);
  if (!sport) return [sportId];
  if (sport.parentId == null) {
    return [sport.id, ...state.sports.filter((item) => item.parentId === sport.id).map((item) => item.id)];
  }
  return [sport.id];
}

export function toSport(state: CatalogState, sport: SportRecord): SportView {
  return {
    ...sport,
    subsports:
      sport.parentId == null
        ? state.sports.filter((item) => item.parentId === sport.id).map((item) => item.name)
        : [],
  };
}

export function listSports(
  state: CatalogState,
  filters: { q?: string; status?: string; soloPadres?: boolean },
): SportView[] {
  return state.sports
    .filter((sport) => (filters.soloPadres ? sport.parentId == null : true))
    .filter((sport) => (filters.status ? sport.status === filters.status : true))
    .filter((sport) => (filters.q ? includesText(sport.name, filters.q) || includesText(sport.category, filters.q) : true))
    .map((sport) => toSport(state, sport));
}

export function listTeams(
  state: CatalogState,
  filters: { q?: string; status?: string; sportId?: number },
): TeamView[] {
  const family = filters.sportId == null ? null : new Set(sportFamily(state, filters.sportId));
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
    sports: state.teamSports
      .filter((link) => link.teamId === team.id)
      .map((link) => state.sports.find((sport) => sport.id === link.sportId))
      .filter((sport): sport is SportRecord => Boolean(sport))
      .map((sport) => ({ id: sport.id, name: sport.name, parentId: sport.parentId })),
    players: state.contracts.filter((contract) => contract.teamId === team.id && contract.status === 'active').length,
  };
}

function currentTeam(state: CatalogState, playerId: number): { id: number; name: string } | null {
  const active = state.contracts.find((contract) => contract.playerId === playerId && contract.status === 'active');
  if (!active) return null;
  const team = state.teams.find((item) => item.id === active.teamId);
  return team ? { id: team.id, name: team.name } : null;
}

export function toPlayer(state: CatalogState, player: PlayerRecord): PlayerView {
  return { ...player, currentTeam: currentTeam(state, player.id) };
}

export function listPlayers(
  state: CatalogState,
  filters: { q?: string; status?: string; teamId?: number; sportId?: number },
): PlayerView[] {
  const family = filters.sportId == null ? null : new Set(sportFamily(state, filters.sportId));
  return state.players
    .filter((player) => (filters.status ? player.status === filters.status : true))
    .filter((player) =>
      filters.q ? includesText(player.fullName, filters.q) || includesText(player.document, filters.q) : true,
    )
    .filter((player) => {
      if (filters.teamId == null) return true;
      return state.contracts.some(
        (contract) =>
          contract.playerId === player.id && contract.teamId === filters.teamId && contract.status === 'active',
      );
    })
    .filter((player) => {
      if (!family) return true;
      if (player.preferredSportId != null && family.has(player.preferredSportId)) return true;
      const active = state.contracts.find((contract) => contract.playerId === player.id && contract.status === 'active');
      if (!active) return false;
      return state.teamSports.some((link) => link.teamId === active.teamId && family.has(link.sportId));
    })
    .map((player) => toPlayer(state, player));
}

export function listSkills(state: CatalogState, filters: { q?: string; category?: string }): SkillView[] {
  return state.skills
    .filter((skill) => (filters.category ? sameName(skill.category, filters.category) : true))
    .filter((skill) => (filters.q ? includesText(skill.name, filters.q) : true))
    .map((skill) => ({
      ...skill,
      players: state.playerSkills.filter((link) => link.skillId === skill.id).length,
    }));
}

function contractView(state: CatalogState, contract: ContractRecord) {
  const player = state.players.find((item) => item.id === contract.playerId);
  const team = state.teams.find((item) => item.id === contract.teamId);
  return {
    ...contract,
    player: player
      ? { id: player.id, fullName: player.fullName, position: player.position, document: player.document, status: player.status }
      : null,
    team: team ? { id: team.id, name: team.name } : null,
  };
}

export function buildRoster(state: CatalogState, teamId: number) {
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return null;
  const contracts = state.contracts.filter((contract) => contract.teamId === teamId).map((contract) => contractView(state, contract));
  return {
    team: toTeam(state, team),
    actuales: contracts.filter((contract) => contract.status === 'active'),
    historial: contracts.filter((contract) => contract.status !== 'active'),
  };
}

export function buildProfile(state: CatalogState, playerId: number) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return null;
  const contracts = state.contracts
    .filter((contract) => contract.playerId === playerId)
    .map((contract) => contractView(state, contract));
  const skills = state.playerSkills
    .filter((link) => link.playerId === playerId)
    .map((link) => {
      const skill = state.skills.find((item) => item.id === link.skillId);
      return skill ? { ...skill, score: link.score } : null;
    })
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));
  const media = skills.length
    ? Math.round(skills.reduce((total, skill) => total + skill.score, 0) / skills.length)
    : null;
  const radar = Object.entries(RADAR_ALIASES).map(([axis, aliases]) => {
    const skill = skills.find((item) =>
      aliases.some((alias) => item.name.toLocaleLowerCase('es') === alias.toLocaleLowerCase('es')),
    );
    return { axis, score: skill?.score ?? null };
  });
  return {
    player: toPlayer(state, player),
    currentContract: contracts.find((contract) => contract.status === 'active') ?? null,
    historial: contracts.filter((contract) => contract.status !== 'active'),
    skills,
    media,
    radar,
    messages: {
      teams: contracts.length === 0 ? 'Este player no tiene teams associated.' : null,
      skills: skills.length === 0 ? 'Este player no tiene skills registradas.' : null,
    },
  };
}
