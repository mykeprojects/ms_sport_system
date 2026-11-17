import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { nameKey } from './catalog.text';
import { Sport } from '../sport/entities/sport.entity';
import { Team } from '../team/entities/team.entity';
import { TeamSport } from '../team_sport/entities/team-sport.entity';
import { Skill } from '../skill/entities/skill.entity';
import { Player } from '../player/entities/player.entity';
import { PlayerSkill } from '../player_skill/entities/player-skill.entity';
import { Contract } from '../contract/entities/contract.entity';

type SportSeed = {
  key: string;
  code: string;
  name: string;
  category: string;
  description: string;
  status: string;
  parent?: string;
  createdAt: string;
};

const SPORTS: SportSeed[] = [
  { key: 'futbol', code: 'DEP-001', name: 'Fútbol', category: 'Ball', description: 'Team sport played between two teams of eleven players each.', status: 'active', createdAt: '2024-01-15' },
  { key: 'baloncesto', code: 'DEP-002', name: 'Baloncesto', category: 'Ball', description: 'Team sport in which players score by shooting the ball through a basket.', status: 'active', createdAt: '2024-02-02' },
  { key: 'voleibol', code: 'DEP-003', name: 'Voleibol', category: 'Net', description: 'Team sport separated by a net where players keep the ball from touching the ground.', status: 'active', createdAt: '2024-02-18' },
  { key: 'tenis', code: 'DEP-004', name: 'Tenis', category: 'Racket', description: 'Racket sport played in singles or doubles.', status: 'active', createdAt: '2024-03-04' },
  { key: 'futbol-11', code: 'DEP-006', name: 'Fútbol 11', category: 'Ball', description: 'Subsport of Fútbol.', status: 'active', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-salon', code: 'DEP-007', name: 'Fútbol de salón', category: 'Ball', description: 'Subsport of Fútbol.', status: 'active', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-callejero', code: 'DEP-008', name: 'Fútbol callejero', category: 'Ball', description: 'Subsport of Fútbol.', status: 'active', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-playa', code: 'DEP-009', name: 'Fútbol playa', category: 'Ball', description: 'Subsport of Fútbol.', status: 'active', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-5', code: 'DEP-010', name: 'Fútbol 5', category: 'Ball', description: 'Subsport of Fútbol.', status: 'active', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'baloncesto-5', code: 'DEP-011', name: 'Baloncesto 5x5', category: 'Ball', description: 'Subsport of Baloncesto.', status: 'active', parent: 'baloncesto', createdAt: '2024-02-02' },
  { key: 'baloncesto-3', code: 'DEP-012', name: 'Baloncesto 3x3', category: 'Ball', description: 'Subsport of Baloncesto.', status: 'active', parent: 'baloncesto', createdAt: '2024-02-02' },
  { key: 'voleibol-pista', code: 'DEP-013', name: 'Voleibol de pista', category: 'Net', description: 'Subsport of Voleibol.', status: 'active', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'voleibol-playa', code: 'DEP-014', name: 'Voleibol de playa', category: 'Net', description: 'Subsport of Voleibol.', status: 'active', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'voleibol-sala', code: 'DEP-015', name: 'Voleibol de sala', category: 'Net', description: 'Subsport of Voleibol.', status: 'active', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'tenis-singles', code: 'DEP-016', name: 'Tenis individual', category: 'Racket', description: 'Subsport of Tenis.', status: 'active', parent: 'tenis', createdAt: '2024-03-04' },
  { key: 'tenis-dobles', code: 'DEP-017', name: 'Tenis dobles', category: 'Racket', description: 'Subsport of Tenis.', status: 'active', parent: 'tenis', createdAt: '2024-03-04' },
];

const TEAMS = [
  { key: 'atletico', code: 'EQ-001', name: 'Atlético Manizales', shortName: 'Atl. Manizales', city: 'Manizales', description: 'Training and competition team dedicated to the comprehensive development of athletes across different sports. Our goal is to develop local talent and compete at the highest level.', status: 'active', createdAt: '2022-03-15', color: '#e11d48' },
  { key: 'caldas', code: 'EQ-002', name: 'Deportivo Caldas', shortName: 'Dep. Caldas', city: 'Manizales', description: 'Historic regional club with its own academy and participation in several sports.', status: 'active', createdAt: '2018-08-11', color: '#16a34a' },
  { key: 'titanes', code: 'EQ-003', name: 'Titanes FC', shortName: 'Titanes', city: 'Pereira', description: 'Competition team focused on youth football and basketball.', status: 'active', createdAt: '2019-04-02', color: '#f59e0b' },
  { key: 'andino', code: 'EQ-004', name: 'Real Andino', shortName: 'R. Andino', city: 'Armenia', description: 'Club on a sports hiatus. Its history and associated sports are preserved.', status: 'inactive', createdAt: '2016-11-09', color: '#38bdf8' },
  { key: 'condores', code: 'EQ-005', name: 'Cóndores FC', shortName: 'Cóndores', city: 'Ibagué', description: 'Regional team with an active roster in football and volleyball.', status: 'active', createdAt: '2021-01-20', color: '#eab308' },
];

const LINKS = [
  ['atletico', 'futbol'],
  ['atletico', 'baloncesto'],
  ['atletico', 'voleibol'],
  ['caldas', 'futbol'],
  ['caldas', 'futbol-salon'],
  ['titanes', 'futbol'],
  ['titanes', 'baloncesto'],
  ['andino', 'futbol'],
  ['andino', 'tenis'],
  ['condores', 'futbol'],
  ['condores', 'voleibol'],
];

const PLAYERS = [
  { key: 'juan', fullName: 'Juan Pérez', document: '1.063.245.678', age: 24, nationality: 'Colombia', position: 'DEL', heightM: 1.8, dominantFoot: 'Derecho', status: 'active', email: 'juan.perez@email.com', phone: '+57 300 123 4567', sport: 'futbol', matches: 28, goals: 16, assists: 7, rating: 7.45 },
  { key: 'andres', fullName: 'Andrés Rojas', document: '1.012.345.890', age: 27, nationality: 'Colombia', position: 'MC', heightM: 1.76, dominantFoot: 'Derecho', status: 'active', email: 'andres.rojas@email.com', phone: '+57 301 222 3344', sport: 'futbol', matches: 31, goals: 6, assists: 11, rating: 7.1 },
  { key: 'miguel', fullName: 'Miguel Torres', document: '1.075.654.321', age: 22, nationality: 'Colombia', position: 'DEF', heightM: 1.83, dominantFoot: 'Izquierdo', status: 'active', email: 'miguel.torres@email.com', phone: '+57 302 555 0199', sport: 'futbol', matches: 22, goals: 1, assists: 3, rating: 6.8 },
  { key: 'daniel', fullName: 'Daniel Castro', document: '1.030.987.654', age: 28, nationality: 'Colombia', position: 'POR', heightM: 1.88, dominantFoot: 'Derecho', status: 'inactive', email: 'daniel.castro@email.com', phone: '+57 304 111 9088', sport: 'futbol', matches: 18, goals: 0, assists: 0, rating: 6.9 },
  { key: 'felipe', fullName: 'Felipe Gómez', document: '1.098.765.432', age: 26, nationality: 'Colombia', position: 'DEL', heightM: 1.79, dominantFoot: 'Ambos', status: 'active', email: 'felipe.gomez@email.com', phone: '+57 305 444 2211', sport: 'futbol', matches: 19, goals: 8, assists: 2, rating: 7.0 },
  { key: 'carlos', fullName: 'Carlos Ruiz', document: '1.055.333.210', age: 29, nationality: 'España', position: 'MC', heightM: 1.77, dominantFoot: 'Derecho', status: 'active', email: 'carlos.ruiz@email.com', phone: '+57 300 888 1212', sport: 'futbol', matches: 24, goals: 4, assists: 9, rating: 7.2 },
  { key: 'david', fullName: 'David Torres', document: '1.044.222.109', age: 30, nationality: 'Argentina', position: 'DEF', heightM: 1.84, dominantFoot: 'Derecho', status: 'active', email: 'david.torres@email.com', phone: '+57 310 666 4545', sport: 'futbol', matches: 40, goals: 2, assists: 1, rating: 6.6 },
  { key: 'laura', fullName: 'Laura Méndez', document: '1.099.111.222', age: 21, nationality: 'Colombia', position: 'MC', heightM: 1.68, dominantFoot: 'Izquierdo', status: 'active', email: 'laura.mendez@email.com', phone: '+57 311 777 3030', sport: 'voleibol', matches: 0, goals: 0, assists: 0, rating: 0 },
];

const CONTRACTS = [
  { player: 'juan', team: 'atletico', startDate: '2026-01-01', endDate: '2027-12-31', status: 'active', endReason: null, detail: null },
  { player: 'carlos', team: 'atletico', startDate: '2026-02-15', endDate: '2027-02-15', status: 'active', endReason: null, detail: null },
  { player: 'daniel', team: 'atletico', startDate: '2026-01-10', endDate: '2028-01-10', status: 'active', endReason: null, detail: null },
  { player: 'andres', team: 'caldas', startDate: '2025-07-01', endDate: '2027-06-30', status: 'active', endReason: null, detail: null },
  { player: 'miguel', team: 'titanes', startDate: '2025-01-15', endDate: '2026-12-15', status: 'active', endReason: null, detail: null },
  { player: 'felipe', team: 'condores', startDate: '2025-08-01', endDate: '2027-08-01', status: 'active', endReason: null, detail: null },
  { player: 'david', team: 'atletico', startDate: '2023-01-01', endDate: '2025-12-15', status: 'finished', endReason: 'Transferred', detail: 'Transferred to Deportivo Caldas' },
  { player: 'miguel', team: 'atletico', startDate: '2022-01-01', endDate: '2024-11-30', status: 'finished', endReason: 'Contract completed', detail: 'Agreed contract completion' },
  { player: 'felipe', team: 'atletico', startDate: '2021-02-01', endDate: '2023-06-30', status: 'finished', endReason: 'Transferred', detail: 'Transferred to Cóndores FC' },
];

const SKILLS = [
  { key: 'velocidad', name: 'Velocidad', category: 'Physical', description: 'Player ability to move quickly.', glyph: 'run' },
  { key: 'regate', name: 'Regate', category: 'Technical', description: 'Skill for dribbling past opponents with the ball.', glyph: 'ball' },
  { key: 'definicion', name: 'Definición', category: 'Technical', description: 'Effectiveness and precision when finishing plays.', glyph: 'target' },
  { key: 'resistencia', name: 'Resistencia', category: 'Physical', description: 'Maintains performance throughout the match.', glyph: 'heart' },
  { key: 'pase', name: 'Pase', category: 'Technical', description: 'Accuracy and quality across different types of passes.', glyph: 'pass' },
  { key: 'defensa', name: 'Defensa', category: 'Tactical', description: 'Anticipation, marking, and recovery ability.', glyph: 'shield' },
  { key: 'vision', name: 'Visión de juego', category: 'Tactical', description: 'Reads the game and makes better decisions on the field.', glyph: 'eye' },
  { key: 'liderazgo', name: 'Liderazgo', category: 'Mental', description: 'Positive influence and leadership on and off the field.', glyph: 'crown' },
];

const PLAYER_SKILLS = [
  ['juan', 'velocidad', 91],
  ['juan', 'regate', 88],
  ['juan', 'definicion', 84],
  ['juan', 'resistencia', 86],
  ['juan', 'pase', 78],
  ['juan', 'defensa', 55],
  ['juan', 'vision', 90],
  ['juan', 'liderazgo', 92],
  ['andres', 'velocidad', 74],
  ['andres', 'pase', 86],
  ['andres', 'vision', 88],
  ['miguel', 'defensa', 84],
  ['miguel', 'regate', 61],
  ['miguel', 'resistencia', 80],
  ['daniel', 'velocidad', 70],
  ['daniel', 'defensa', 77],
  ['felipe', 'definicion', 82],
  ['felipe', 'liderazgo', 75],
  ['carlos', 'pase', 84],
  ['carlos', 'regate', 79],
  ['david', 'resistencia', 73],
] as const;

export async function seedCatalog(manager: EntityManager): Promise<void> {
  const sports = new Map<string, number>();
  for (const sport of SPORTS.filter((item) => !item.parent)) {
    const saved = await manager.save(
      manager.create(Sport, {
        code: sport.code,
        name: sport.name,
        nameKey: nameKey(sport.name),
        category: sport.category,
        description: sport.description,
        status: sport.status,
        parentId: null,
        createdAt: sport.createdAt,
      }),
    );
    sports.set(sport.key, saved.id);
  }
  for (const sport of SPORTS.filter((item) => item.parent)) {
    const saved = await manager.save(
      manager.create(Sport, {
        code: sport.code,
        name: sport.name,
        nameKey: nameKey(sport.name),
        category: sport.category,
        description: sport.description,
        status: sport.status,
        parentId: sports.get(sport.parent!),
        createdAt: sport.createdAt,
      }),
    );
    sports.set(sport.key, saved.id);
  }

  const teams = new Map<string, number>();
  for (const team of TEAMS) {
    const saved = await manager.save(
      manager.create(Team, {
        code: team.code,
        name: team.name,
        nameKey: nameKey(team.name),
        shortName: team.shortName,
        city: team.city,
        description: team.description,
        status: team.status,
        createdAt: team.createdAt,
        color: team.color,
      }),
    );
    teams.set(team.key, saved.id);
  }
  await manager.save(
    TeamSport,
    LINKS.map(([team, sport]) =>
      manager.create(TeamSport, { teamId: teams.get(team), sportId: sports.get(sport) }),
    ),
  );

  const players = new Map<string, number>();
  for (const player of PLAYERS) {
    const saved = await manager.save(
      manager.create(Player, {
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
        preferredSportId: sports.get(player.sport),
        matches: player.matches,
        goals: player.goals,
        assists: player.assists,
        rating: player.rating,
      }),
    );
    players.set(player.key, saved.id);
  }
  await manager.save(
    Contract,
    CONTRACTS.map((contract) => {
      const playerId = players.get(contract.player);
      return manager.create(Contract, {
        playerId,
        teamId: teams.get(contract.team),
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        endReason: contract.endReason,
        detail: contract.detail,
        activePlayerKey: contract.status === 'active' ? playerId : null,
      });
    }),
  );

  const skills = new Map<string, number>();
  for (const skill of SKILLS) {
    const saved = await manager.save(
      manager.create(Skill, {
        name: skill.name,
        nameKey: nameKey(skill.name),
        category: skill.category,
        description: skill.description,
        glyph: skill.glyph,
      }),
    );
    skills.set(skill.key, saved.id);
  }
  await manager.save(
    PlayerSkill,
    PLAYER_SKILLS.map(([player, skill, score]) =>
      manager.create(PlayerSkill, {
        playerId: players.get(player),
        skillId: skills.get(skill),
        score,
      }),
    ),
  );
}

@Injectable()
export class CatalogSeedService implements OnModuleInit {
  private readonly logger = new Logger(CatalogSeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    if (process.env.SEED_CATALOG === 'false') return;
    const existing = await this.dataSource.getRepository(Sport).count();
    if (existing > 0) return;
    await this.dataSource.transaction((manager) => seedCatalog(manager));
    this.logger.log('Sample sports catalog loaded.');
  }
}
