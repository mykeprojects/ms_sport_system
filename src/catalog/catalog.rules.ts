import { addYears, nextCode, normalize, sameName, todayIso } from './catalog.text';
import type {
  CatalogState,
  ContractRecord,
  PlayerInput,
  PlayerRecord,
  RuleResult,
  SkillInput,
  SkillRecord,
  SportInput,
  SportRecord,
  TeamInput,
  TeamRecord,
} from './catalog.types';

type Clock = () => string;

const fail = (status: 400 | 404 | 409, message: string): RuleResult => ({
  ok: false,
  status,
  message,
});

const success = (state: CatalogState, message: string, id?: number): RuleResult => ({
  ok: true,
  state,
  message,
  id,
});

function createIds() {
  let next = -1;
  return () => next--;
}

function nameTaken(sports: SportRecord[], name: string, ignore: Set<number>): boolean {
  return sports.some((sport) => !ignore.has(sport.id) && sameName(sport.name, name));
}

function closeContract(
  contract: ContractRecord,
  reason: string,
  detail: string,
  today: string,
): ContractRecord {
  const endDate = contract.startDate > today ? contract.startDate : today;
  return {
    ...contract,
    status: 'finalizado',
    endReason: reason,
    detail,
    endDate,
  };
}

function openContract(
  id: number,
  playerId: number,
  teamId: number,
  startDate: string,
  endDate: string,
): ContractRecord {
  return {
    id,
    playerId,
    teamId,
    startDate,
    endDate,
    status: 'activo',
    endReason: null,
    detail: null,
  };
}

export function saveSport(state: CatalogState, input: SportInput, now = todayIso()): RuleResult {
  const name = normalize(input.name);
  const category = normalize(input.category);
  const description = input.description.trim();
  const subdeportes = input.subdeportes.map(normalize).filter(Boolean);
  const ids = createIds();

  if (!name || !category) {
    return fail(400, 'Completa los campos obligatorios.');
  }
  if (description.length > 250) {
    return fail(400, 'La descripción admite máximo 250 caracteres.');
  }

  const ownChildren = new Set(
    state.sports.filter((sport) => input.id && sport.parentId === input.id).map((sport) => sport.id),
  );
  const ignore = new Set<number>(input.id ? [input.id, ...ownChildren] : []);
  if (nameTaken(state.sports, name, ignore)) {
    return fail(409, 'Ya existe un deporte con este nombre.');
  }

  const uniqueSubs: string[] = [];
  for (const sub of subdeportes) {
    if (sameName(sub, name) || uniqueSubs.some((item) => sameName(item, sub))) {
      return fail(400, `El subdeporte "${sub}" está repetido.`);
    }
    const existingChild = state.sports.find(
      (sport) => input.id && sport.parentId === input.id && sameName(sport.name, sub),
    );
    const subIgnore = new Set(ignore);
    if (existingChild) subIgnore.add(existingChild.id);
    if (nameTaken(state.sports, sub, subIgnore)) {
      return fail(409, `Ya existe un deporte con el nombre "${sub}".`);
    }
    uniqueSubs.push(sub);
  }

  if (!input.id) {
    const parent: SportRecord = {
      id: ids(),
      code: nextCode(state.sports, 'DEP'),
      name,
      category,
      description,
      status: input.status,
      parentId: null,
      createdAt: now,
    };
    const children: SportRecord[] = [];
    for (const sub of uniqueSubs) {
      children.push({
        id: ids(),
        code: nextCode([...state.sports, parent, ...children], 'DEP'),
        name: sub,
        category,
        description: `Subdeporte de ${name}.`,
        status: input.status,
        parentId: parent.id,
        createdAt: now,
      });
    }
    return success(
      { ...state, sports: [...state.sports, parent, ...children] },
      'El deporte se registró correctamente.',
      parent.id,
    );
  }

  const current = state.sports.find((sport) => sport.id === input.id && sport.parentId === null);
  if (!current) return fail(404, 'No se encontró el deporte.');

  const removed = state.sports.filter(
    (sport) => sport.parentId === current.id && !uniqueSubs.some((sub) => sameName(sub, sport.name)),
  );
  const blocked = removed.find((sport) => state.teamSports.some((link) => link.sportId === sport.id));
  if (blocked) {
    return fail(409, `No se puede quitar "${blocked.name}" porque tiene equipos asociados.`);
  }

  const withoutChildren = state.sports
    .filter((sport) => sport.parentId !== current.id)
    .map((sport) =>
      sport.id === current.id ? { ...sport, name, category, description, status: input.status } : sport,
    );
  const rebuilt: SportRecord[] = [];
  for (const sub of uniqueSubs) {
    const existing = state.sports.find(
      (sport) => sport.parentId === current.id && sameName(sport.name, sub),
    );
    if (existing) {
      rebuilt.push({ ...existing, name: sub, category, status: input.status });
      continue;
    }
    rebuilt.push({
      id: ids(),
      code: nextCode([...withoutChildren, ...rebuilt], 'DEP'),
      name: sub,
      category,
      description: `Subdeporte de ${name}.`,
      status: input.status,
      parentId: current.id,
      createdAt: now,
    });
  }

  return success(
    { ...state, sports: [...withoutChildren, ...rebuilt] },
    'El deporte se actualizó correctamente.',
    current.id,
  );
}

export function deleteSport(state: CatalogState, id: number): RuleResult {
  const sport = state.sports.find((item) => item.id === id && item.parentId === null);
  if (!sport) return fail(404, 'No se encontró el deporte.');
  const family = state.sports.filter((item) => item.id === id || item.parentId === id).map((item) => item.id);
  if (state.teamSports.some((link) => family.includes(link.sportId))) {
    return fail(409, `No se puede eliminar "${sport.name}" porque tiene equipos asociados.`);
  }
  return success(
    {
      ...state,
      sports: state.sports.filter((item) => !family.includes(item.id)),
      players: state.players.map((player) =>
        player.preferredSportId != null && family.includes(player.preferredSportId)
          ? { ...player, preferredSportId: null }
          : player,
      ),
    },
    `Se eliminó "${sport.name}".`,
  );
}

export function saveTeam(state: CatalogState, input: TeamInput, now = todayIso()): RuleResult {
  const name = normalize(input.name);
  const shortName = normalize(input.shortName);
  const city = normalize(input.city);
  const description = input.description.trim();
  if (!name || !shortName || !city) return fail(400, 'Completa los campos obligatorios.');
  if (state.teams.some((team) => team.id !== input.id && sameName(team.name, name))) {
    return fail(409, 'Ya existe un equipo con este nombre.');
  }

  if (!input.id) {
    const team: TeamRecord = {
      id: createIds()(),
      code: nextCode(state.teams, 'EQ'),
      name,
      shortName,
      city,
      description,
      status: input.status,
      createdAt: now,
      color: '#3dff7a',
    };
    return success(
      { ...state, teams: [...state.teams, team] },
      'El equipo se registró correctamente.',
      team.id,
    );
  }

  const current = state.teams.find((team) => team.id === input.id);
  if (!current) return fail(404, 'No se encontró el equipo.');
  return success(
    {
      ...state,
      teams: state.teams.map((team) =>
        team.id === current.id ? { ...team, name, shortName, city, description, status: input.status } : team,
      ),
    },
    'El equipo se actualizó correctamente.',
    current.id,
  );
}

export function deleteTeam(state: CatalogState, id: number): RuleResult {
  const team = state.teams.find((item) => item.id === id);
  if (!team) return fail(404, 'No se encontró el equipo.');
  if (state.contracts.some((contract) => contract.teamId === id)) {
    return fail(409, 'No se puede eliminar el equipo porque tiene jugadores o competencias asociadas.');
  }
  if (state.teamSports.some((link) => link.teamId === id)) {
    return fail(
      409,
      'No se puede eliminar el equipo porque tiene deportes asociados. Retira las asociaciones primero.',
    );
  }
  return success(
    { ...state, teams: state.teams.filter((item) => item.id !== id) },
    `Se eliminó "${team.name}".`,
  );
}

export function associateSport(state: CatalogState, teamId: number, sportId: number): RuleResult {
  const team = state.teams.find((item) => item.id === teamId);
  const sport = state.sports.find((item) => item.id === sportId);
  if (!team || !sport) return fail(404, 'El equipo y el deporte deben existir.');
  if (state.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(409, 'Este deporte ya se encuentra asociado al equipo.');
  }
  return success(
    { ...state, teamSports: [...state.teamSports, { teamId, sportId }] },
    `${sport.name} asociado correctamente.`,
  );
}

export function removeSportAssociation(state: CatalogState, teamId: number, sportId: number): RuleResult {
  const sport = state.sports.find((item) => item.id === sportId);
  if (!state.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(404, 'Esa asociación no existe.');
  }
  return success(
    {
      ...state,
      teamSports: state.teamSports.filter((link) => !(link.teamId === teamId && link.sportId === sportId)),
    },
    `Se retiró la asociación${sport ? ` de ${sport.name}` : ''}. El equipo y el deporte siguen registrados.`,
  );
}

export function savePlayer(state: CatalogState, input: PlayerInput, now = todayIso()): RuleResult {
  const fullName = normalize(input.fullName);
  const document = normalize(input.document);
  const nationality = normalize(input.nationality);
  const position = normalize(input.position);
  const dominantFoot = normalize(input.dominantFoot);
  const email = input.email.trim();
  const phone = input.phone.trim();
  if (!fullName || !document || !nationality || !position || !dominantFoot) {
    return fail(400, 'Completa los campos obligatorios.');
  }
  if (!Number.isFinite(input.age) || input.age < 15 || input.age > 50) {
    return fail(400, 'La edad debe estar entre 15 y 50 años.');
  }
  if (!Number.isFinite(input.heightM) || input.heightM < 1.4 || input.heightM > 2.3) {
    return fail(400, 'La altura debe estar entre 1.40 m y 2.30 m.');
  }
  if (email && !email.includes('@')) return fail(400, 'El correo no tiene un formato válido.');
  if (
    input.preferredSportId != null &&
    !state.sports.some((sport) => sport.id === input.preferredSportId)
  ) {
    return fail(404, 'El deporte preferido no existe.');
  }
  if (state.players.some((player) => player.id !== input.id && sameName(player.document, document))) {
    return fail(409, 'Ya existe un jugador registrado con este número de documento.');
  }
  if (input.syncTeam && input.teamId != null && !state.teams.some((team) => team.id === input.teamId)) {
    return fail(404, 'El equipo seleccionado no existe.');
  }

  const current = input.id ? state.players.find((player) => player.id === input.id) : undefined;
  if (input.id && !current) return fail(404, 'No se encontró el jugador.');

  const player: PlayerRecord = {
    id: current?.id ?? createIds()(),
    fullName,
    document,
    age: input.age,
    nationality,
    position,
    heightM: input.heightM,
    dominantFoot,
    status: input.status,
    email,
    phone,
    preferredSportId:
      input.preferredSportId === undefined ? (current?.preferredSportId ?? null) : input.preferredSportId,
    stats: current?.stats ?? { matches: 0, goals: 0, assists: 0, rating: 0 },
  };

  let contracts = state.contracts;
  if (input.syncTeam) {
    const active = contracts.find((contract) => contract.playerId === player.id && contract.status === 'activo');
    if (input.teamId == null && active) {
      contracts = contracts.map((contract) =>
        contract.id === active.id ? closeContract(contract, 'Transferido', 'Retirado de la plantilla', now) : contract,
      );
    } else if (input.teamId != null && active && active.teamId !== input.teamId) {
      const destination = state.teams.find((team) => team.id === input.teamId);
      contracts = contracts.map((contract) =>
        contract.id === active.id
          ? closeContract(contract, 'Transferido', `Transferido a ${destination?.name ?? 'otro equipo'}`, now)
          : contract,
      );
      contracts = [...contracts, openContract(createIds()(), player.id, input.teamId, now, addYears(now, 1))];
    } else if (input.teamId != null && !active) {
      contracts = [...contracts, openContract(createIds()(), player.id, input.teamId, now, addYears(now, 1))];
    }
  }

  const players = current
    ? state.players.map((item) => (item.id === player.id ? player : item))
    : [...state.players, player];

  return success(
    { ...state, players, contracts },
    current ? 'El jugador se actualizó correctamente.' : 'El jugador se registró correctamente.',
    player.id,
  );
}

export function deletePlayer(state: CatalogState, id: number): RuleResult {
  const player = state.players.find((item) => item.id === id);
  if (!player) return fail(404, 'No se encontró el jugador.');
  if (state.contracts.some((contract) => contract.playerId === id)) {
    return fail(409, 'No se puede eliminar el jugador porque tiene equipos con información deportiva asociada.');
  }
  return success(
    {
      ...state,
      players: state.players.filter((item) => item.id !== id),
      playerSkills: state.playerSkills.filter((link) => link.playerId !== id),
    },
    `Se eliminó a ${player.fullName}.`,
  );
}

export function assignContract(
  state: CatalogState,
  input: { playerId: number; teamId: number; startDate: string; endDate: string },
): RuleResult {
  const player = state.players.find((item) => item.id === input.playerId);
  const team = state.teams.find((item) => item.id === input.teamId);
  if (!player || !team) return fail(404, 'El jugador y el equipo deben existir.');
  if (!input.startDate || !input.endDate) {
    return fail(400, 'Indica la fecha de inicio y la fecha de fin del contrato.');
  }
  if (input.endDate < input.startDate) {
    return fail(400, 'La fecha de fin debe ser igual o posterior a la de inicio.');
  }
  const active = state.contracts.find((contract) => contract.playerId === player.id && contract.status === 'activo');
  if (active?.teamId === team.id) return fail(409, 'Este jugador ya se encuentra asociado al equipo.');
  if (active) {
    const currentTeam = state.teams.find((item) => item.id === active.teamId);
    return fail(
      409,
      `El jugador ya pertenece a ${currentTeam?.name ?? 'otro equipo'}. Retíralo de esa plantilla para asignarlo.`,
    );
  }
  const contract = openContract(createIds()(), player.id, team.id, input.startDate, input.endDate);
  return success(
    { ...state, contracts: [...state.contracts, contract] },
    `${player.fullName} quedó asignado a ${team.name}. Su historial anterior se conserva.`,
    contract.id,
  );
}

export function updateContract(
  state: CatalogState,
  contractId: number,
  startDate: string,
  endDate: string,
  now = todayIso(),
): RuleResult {
  const current = state.contracts.find((contract) => contract.id === contractId);
  if (!current) return fail(404, 'No se encontró la vinculación.');
  if (!startDate || !endDate || endDate < startDate) return fail(400, 'Revisa las fechas del contrato.');
  const finished = current.status === 'activo' && endDate < now;
  return success(
    {
      ...state,
      contracts: state.contracts.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              startDate,
              endDate,
              status: finished ? 'finalizado' : contract.status,
              endReason: finished ? 'Finalizó contrato' : contract.endReason,
              detail: finished ? 'Fin del contrato acordado' : contract.detail,
            }
          : contract,
      ),
    },
    'La vinculación se actualizó correctamente.',
    contractId,
  );
}

export function releasePlayer(
  state: CatalogState,
  contractId: number,
  reason: string,
  detail: string,
  now = todayIso(),
): RuleResult {
  const current = state.contracts.find((contract) => contract.id === contractId);
  if (!current || current.status !== 'activo') {
    return fail(404, 'El jugador no tiene una vinculación activa para retirar.');
  }
  const cleanReason = normalize(reason) || 'Transferido';
  const cleanDetail = detail.trim() || 'El jugador dejó la plantilla actual y su vinculación quedó en el historial.';
  return success(
    {
      ...state,
      contracts: state.contracts.map((contract) =>
        contract.id === contractId ? closeContract(contract, cleanReason, cleanDetail, now) : contract,
      ),
    },
    'El jugador dejó la plantilla actual. Su vinculación quedó en el historial.',
  );
}

export function saveSkill(state: CatalogState, input: SkillInput): RuleResult {
  const name = normalize(input.name);
  const description = input.description.trim();
  if (!name || !input.category || !description) return fail(400, 'Completa los campos obligatorios.');
  if (state.skills.some((skill) => skill.id !== input.id && sameName(skill.name, name))) {
    return fail(409, 'Ya existe una habilidad con este nombre.');
  }
  if (!input.id) {
    const skill: SkillRecord = {
      id: createIds()(),
      name,
      category: input.category,
      description,
      glyph: input.glyph ?? 'target',
    };
    return success(
      { ...state, skills: [...state.skills, skill] },
      'La habilidad se registró correctamente.',
      skill.id,
    );
  }
  const current = state.skills.find((skill) => skill.id === input.id);
  if (!current) return fail(404, 'No se encontró la habilidad.');
  return success(
    {
      ...state,
      skills: state.skills.map((skill) =>
        skill.id === current.id ? { ...skill, name, category: input.category, description } : skill,
      ),
    },
    'La habilidad se actualizó correctamente.',
    current.id,
  );
}

export function deleteSkill(state: CatalogState, id: number): RuleResult {
  const skill = state.skills.find((item) => item.id === id);
  if (!skill) return fail(404, 'No se encontró la habilidad.');
  const assigned = state.playerSkills.filter((link) => link.skillId === id).length;
  if (assigned > 0) {
    return fail(
      409,
      `No se puede eliminar "${skill.name}" porque está asignada a ${assigned} ${assigned === 1 ? 'jugador' : 'jugadores'}.`,
    );
  }
  return success(
    { ...state, skills: state.skills.filter((item) => item.id !== id) },
    `Se eliminó "${skill.name}".`,
  );
}

export function assignSkill(state: CatalogState, playerId: number, skillId: number): RuleResult {
  const player = state.players.find((item) => item.id === playerId);
  const skill = state.skills.find((item) => item.id === skillId);
  if (!player || !skill) return fail(404, 'El jugador y la habilidad deben existir.');
  if (state.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(409, 'Esta habilidad ya se encuentra asignada al jugador.');
  }
  const seed = `${playerId}:${skillId}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return success(
    {
      ...state,
      playerSkills: [...state.playerSkills, { playerId, skillId, score: 68 + (seed % 28) }],
    },
    'Habilidad asignada correctamente.',
  );
}

export function removePlayerSkill(state: CatalogState, playerId: number, skillId: number): RuleResult {
  if (!state.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(404, 'El jugador no tiene esa habilidad.');
  }
  return success(
    {
      ...state,
      playerSkills: state.playerSkills.filter((link) => !(link.playerId === playerId && link.skillId === skillId)),
    },
    'Se retiró la habilidad del jugador. La habilidad sigue en el catálogo.',
  );
}
