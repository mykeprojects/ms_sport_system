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
    status: 'finished',
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
    status: 'active',
    endReason: null,
    detail: null,
  };
}

export function saveSport(state: CatalogState, input: SportInput, now = todayIso()): RuleResult {
  const name = normalize(input.name);
  const category = normalize(input.category);
  const description = input.description.trim();
  const subsports = input.subsports.map(normalize).filter(Boolean);
  const ids = createIds();

  if (!name || !category) {
    return fail(400, 'Complete all required fields.');
  }
  if (description.length > 250) {
    return fail(400, 'Description cannot exceed 250 characters.');
  }

  const ownChildren = new Set(
    state.sports.filter((sport) => input.id && sport.parentId === input.id).map((sport) => sport.id),
  );
  const ignore = new Set<number>(input.id ? [input.id, ...ownChildren] : []);
  if (nameTaken(state.sports, name, ignore)) {
    return fail(409, 'A sport with this name already exists.');
  }

  const uniqueSubs: string[] = [];
  for (const sub of subsports) {
    if (sameName(sub, name) || uniqueSubs.some((item) => sameName(item, sub))) {
      return fail(400, `The subsport "${sub}" is duplicated.`);
    }
    const existingChild = state.sports.find(
      (sport) => input.id && sport.parentId === input.id && sameName(sport.name, sub),
    );
    const subIgnore = new Set(ignore);
    if (existingChild) subIgnore.add(existingChild.id);
    if (nameTaken(state.sports, sub, subIgnore)) {
      return fail(409, `A sport with the name "${sub}" already exists.`);
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
        description: `Subsport of ${name}.`,
        status: input.status,
        parentId: parent.id,
        createdAt: now,
      });
    }
    return success(
      { ...state, sports: [...state.sports, parent, ...children] },
      'Sport created successfully.',
      parent.id,
    );
  }

  const current = state.sports.find((sport) => sport.id === input.id && sport.parentId === null);
  if (!current) return fail(404, 'Sport not found.');

  const removed = state.sports.filter(
    (sport) => sport.parentId === current.id && !uniqueSubs.some((sub) => sameName(sub, sport.name)),
  );
  const blocked = removed.find((sport) => state.teamSports.some((link) => link.sportId === sport.id));
  if (blocked) {
    return fail(409, `Cannot remove "${blocked.name}" because teams are associated with it.`);
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
      description: `Subsport of ${name}.`,
      status: input.status,
      parentId: current.id,
      createdAt: now,
    });
  }

  return success(
    { ...state, sports: [...withoutChildren, ...rebuilt] },
    'Sport updated successfully.',
    current.id,
  );
}

export function deleteSport(state: CatalogState, id: number): RuleResult {
  const sport = state.sports.find((item) => item.id === id && item.parentId === null);
  if (!sport) return fail(404, 'Sport not found.');
  const family = state.sports.filter((item) => item.id === id || item.parentId === id).map((item) => item.id);
  if (state.teamSports.some((link) => family.includes(link.sportId))) {
    return fail(409, `Cannot delete "${sport.name}" because teams are associated with it.`);
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
    `Removed "${sport.name}".`,
  );
}

export function saveTeam(state: CatalogState, input: TeamInput, now = todayIso()): RuleResult {
  const name = normalize(input.name);
  const shortName = normalize(input.shortName);
  const city = normalize(input.city);
  const description = input.description.trim();
  if (!name || !shortName || !city) return fail(400, 'Complete all required fields.');
  if (state.teams.some((team) => team.id !== input.id && sameName(team.name, name))) {
    return fail(409, 'A team with this name already exists.');
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
      'Team created successfully.',
      team.id,
    );
  }

  const current = state.teams.find((team) => team.id === input.id);
  if (!current) return fail(404, 'Team not found.');
  return success(
    {
      ...state,
      teams: state.teams.map((team) =>
        team.id === current.id ? { ...team, name, shortName, city, description, status: input.status } : team,
      ),
    },
    'Team updated successfully.',
    current.id,
  );
}

export function deleteTeam(state: CatalogState, id: number): RuleResult {
  const team = state.teams.find((item) => item.id === id);
  if (!team) return fail(404, 'Team not found.');
  if (state.contracts.some((contract) => contract.teamId === id)) {
    return fail(409, 'Cannot delete the team because it has players or associated competitions.');
  }
  if (state.teamSports.some((link) => link.teamId === id)) {
    return fail(
      409,
      'Cannot delete the team because sports are associated with it. Remove the associations first.',
    );
  }
  return success(
    { ...state, teams: state.teams.filter((item) => item.id !== id) },
    `Removed "${team.name}".`,
  );
}

export function associateSport(state: CatalogState, teamId: number, sportId: number): RuleResult {
  const team = state.teams.find((item) => item.id === teamId);
  const sport = state.sports.find((item) => item.id === sportId);
  if (!team || !sport) return fail(404, 'The team and sport must exist.');
  if (state.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(409, 'This sport is already associated with the team.');
  }
  return success(
    { ...state, teamSports: [...state.teamSports, { teamId, sportId }] },
    `${sport.name} associated successfully.`,
  );
}

export function removeSportAssociation(state: CatalogState, teamId: number, sportId: number): RuleResult {
  const sport = state.sports.find((item) => item.id === sportId);
  if (!state.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(404, 'That association does not exist.');
  }
  return success(
    {
      ...state,
      teamSports: state.teamSports.filter((link) => !(link.teamId === teamId && link.sportId === sportId)),
    },
    `Association${sport ? ` with ${sport.name}` : ''} released. The team and sport remain registered.`,
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
    return fail(400, 'Complete all required fields.');
  }
  if (!Number.isFinite(input.age) || input.age < 15 || input.age > 50) {
    return fail(400, 'Age must be between 15 and 50 years.');
  }
  if (!Number.isFinite(input.heightM) || input.heightM < 1.4 || input.heightM > 2.3) {
    return fail(400, 'Height must be between 1.40 m and 2.30 m.');
  }
  if (email && !email.includes('@')) return fail(400, 'Email format is invalid.');
  if (
    input.preferredSportId != null &&
    !state.sports.some((sport) => sport.id === input.preferredSportId)
  ) {
    return fail(404, 'The preferred sport does not exist.');
  }
  if (state.players.some((player) => player.id !== input.id && sameName(player.document, document))) {
    return fail(409, 'A player with this document number already exists.');
  }
  if (input.syncTeam && input.teamId != null && !state.teams.some((team) => team.id === input.teamId)) {
    return fail(404, 'The selected team does not exist.');
  }

  const current = input.id ? state.players.find((player) => player.id === input.id) : undefined;
  if (input.id && !current) return fail(404, 'Player not found.');

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
    const active = contracts.find((contract) => contract.playerId === player.id && contract.status === 'active');
    if (input.teamId == null && active) {
      contracts = contracts.map((contract) =>
        contract.id === active.id ? closeContract(contract, 'Transferred', 'Removed from the roster', now) : contract,
      );
    } else if (input.teamId != null && active && active.teamId !== input.teamId) {
      const destination = state.teams.find((team) => team.id === input.teamId);
      contracts = contracts.map((contract) =>
        contract.id === active.id
          ? closeContract(contract, 'Transferred', `Transferred to ${destination?.name ?? 'another team'}`, now)
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
    current ? 'Player updated successfully.' : 'Player created successfully.',
    player.id,
  );
}

export function deletePlayer(state: CatalogState, id: number): RuleResult {
  const player = state.players.find((item) => item.id === id);
  if (!player) return fail(404, 'Player not found.');
  if (state.contracts.some((contract) => contract.playerId === id)) {
    return fail(409, 'Cannot delete the player because it has teams with associated sports information.');
  }
  return success(
    {
      ...state,
      players: state.players.filter((item) => item.id !== id),
      playerSkills: state.playerSkills.filter((link) => link.playerId !== id),
    },
    `Removed a ${player.fullName}.`,
  );
}

export function assignContract(
  state: CatalogState,
  input: { playerId: number; teamId: number; startDate: string; endDate: string },
): RuleResult {
  const player = state.players.find((item) => item.id === input.playerId);
  const team = state.teams.find((item) => item.id === input.teamId);
  if (!player || !team)   return fail(404, 'The player and team must exist.');
  if (!input.startDate || !input.endDate) {
    return fail(400, 'Provide the contract start and end dates.');
  }
  if (input.endDate < input.startDate) {
    return fail(400, 'The end date must be equal to or later than the start date.');
  }
  const active = state.contracts.find((contract) => contract.playerId === player.id && contract.status === 'active');
  if (active?.teamId === team.id) return fail(409, 'This player is already associated with the team.');
  if (active) {
    const currentTeam = state.teams.find((item) => item.id === active.teamId);
    return fail(
      409,
      `The player already belongs to ${currentTeam?.name ?? 'another team'}. Release the current roster assignment first.`,
    );
  }
  const contract = openContract(createIds()(), player.id, team.id, input.startDate, input.endDate);
  return success(
    { ...state, contracts: [...state.contracts, contract] },
    `${player.fullName} was assigned to ${team.name}. The previous history is preserved.`,
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
  if (!current) return fail(404, 'Contract not found.');
  if (!startDate || !endDate || endDate < startDate) return fail(400, 'Check the contract dates.');
  const finished = current.status === 'active' && endDate < now;
  return success(
    {
      ...state,
      contracts: state.contracts.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              startDate,
              endDate,
              status: finished ? 'finished' : contract.status,
              endReason: finished ? 'Contract completed' : contract.endReason,
              detail: finished ? 'Agreed contract completion' : contract.detail,
            }
          : contract,
      ),
    },
    'Contract updated successfully.',
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
  if (!current || current.status !== 'active') {
    return fail(404, 'The player has no active contract to release.');
  }
  const cleanReason = normalize(reason) || 'Transferred';
  const cleanDetail = detail.trim() || 'The player left the current roster and the contract was moved to history.';
  return success(
    {
      ...state,
      contracts: state.contracts.map((contract) =>
        contract.id === contractId ? closeContract(contract, cleanReason, cleanDetail, now) : contract,
      ),
    },
    'The player left the current roster. The contract was moved to history.',
  );
}

export function saveSkill(state: CatalogState, input: SkillInput): RuleResult {
  const name = normalize(input.name);
  const description = input.description.trim();
  if (!name || !input.category || !description) return fail(400, 'Complete all required fields.');
  if (state.skills.some((skill) => skill.id !== input.id && sameName(skill.name, name))) {
    return fail(409, 'A skill with this name already exists.');
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
      'Skill created successfully.',
      skill.id,
    );
  }
  const current = state.skills.find((skill) => skill.id === input.id);
  if (!current) return fail(404, 'Skill not found.');
  return success(
    {
      ...state,
      skills: state.skills.map((skill) =>
        skill.id === current.id ? { ...skill, name, category: input.category, description } : skill,
      ),
    },
    'Skill updated successfully.',
    current.id,
  );
}

export function deleteSkill(state: CatalogState, id: number): RuleResult {
  const skill = state.skills.find((item) => item.id === id);
  if (!skill) return fail(404, 'Skill not found.');
  const assigned = state.playerSkills.filter((link) => link.skillId === id).length;
  if (assigned > 0) {
    return fail(
      409,
      `Cannot delete "${skill.name}" because it is assigned to ${assigned} ${assigned === 1 ? 'player' : 'players'}.`,
    );
  }
  return success(
    { ...state, skills: state.skills.filter((item) => item.id !== id) },
    `Removed "${skill.name}".`,
  );
}

export function assignSkill(state: CatalogState, playerId: number, skillId: number): RuleResult {
  const player = state.players.find((item) => item.id === playerId);
  const skill = state.skills.find((item) => item.id === skillId);
  if (!player || !skill) return fail(404, 'The player and skill must exist.');
  if (state.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(409, 'This skill is already assigned to the player.');
  }
  const seed = `${playerId}:${skillId}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return success(
    {
      ...state,
      playerSkills: [...state.playerSkills, { playerId, skillId, score: 68 + (seed % 28) }],
    },
    'Skill assigned successfully.',
  );
}

export function removePlayerSkill(state: CatalogState, playerId: number, skillId: number): RuleResult {
  if (!state.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(404, 'The player does not have that skill.');
  }
  return success(
    {
      ...state,
      playerSkills: state.playerSkills.filter((link) => !(link.playerId === playerId && link.skillId === skillId)),
    },
    'Skill released from the player. The skill remains in the catalog.',
  );
}
