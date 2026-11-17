export type Status = 'active' | 'inactive';
export type ContractStatus = 'active' | 'finished';
export type SkillCategory = 'Physical' | 'Technical' | 'Tactical' | 'Mental';

export type SportRecord = {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  status: Status;
  parentId: number | null;
  createdAt: string;
};

export type TeamRecord = {
  id: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
  createdAt: string;
  color: string;
};

export type TeamSportRecord = {
  teamId: number;
  sportId: number;
};

export type PlayerStats = {
  matches: number;
  goals: number;
  assists: number;
  rating: number;
};

export type PlayerRecord = {
  id: number;
  fullName: string;
  document: string;
  age: number;
  nationality: string;
  position: string;
  heightM: number;
  dominantFoot: string;
  status: Status;
  email: string;
  phone: string;
  preferredSportId: number | null;
  stats: PlayerStats;
};

export type ContractRecord = {
  id: number;
  playerId: number;
  teamId: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  endReason: string | null;
  detail: string | null;
};

export type SkillRecord = {
  id: number;
  name: string;
  category: SkillCategory;
  description: string;
  glyph: string;
};

export type PlayerSkillRecord = {
  playerId: number;
  skillId: number;
  score: number;
};

export type CatalogState = {
  sports: SportRecord[];
  teams: TeamRecord[];
  teamSports: TeamSportRecord[];
  players: PlayerRecord[];
  contracts: ContractRecord[];
  skills: SkillRecord[];
  playerSkills: PlayerSkillRecord[];
};

export type SportInput = {
  id?: number;
  name: string;
  category: string;
  description: string;
  status: Status;
  subsports: string[];
};

export type TeamInput = {
  id?: number;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
};

export type PlayerInput = {
  id?: number;
  fullName: string;
  document: string;
  age: number;
  nationality: string;
  position: string;
  heightM: number;
  dominantFoot: string;
  status: Status;
  email: string;
  phone: string;
  preferredSportId?: number | null;
  teamId?: number | null;
  syncTeam: boolean;
};

export type SkillInput = {
  id?: number;
  name: string;
  category: SkillCategory;
  description: string;
  glyph?: string;
};

export type RuleResult =
  | { ok: true; message: string; id?: number; state: CatalogState }
  | { ok: false; status: 400 | 404 | 409; message: string };
