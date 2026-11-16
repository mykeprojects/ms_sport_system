import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { nameKey } from './catalog.text';
import { Deporte } from '../deporte/entities/deporte.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EquipoDeporte } from '../equipo_deporte/entities/equipo-deporte.entity';
import { Habilidad } from '../habilidad/entities/habilidad.entity';
import { Jugador } from '../jugador/entities/jugador.entity';
import { JugadorHabilidad } from '../jugador_habilidad/entities/jugador-habilidad.entity';
import { Vinculacion } from '../vinculacion/entities/vinculacion.entity';

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
  { key: 'futbol', code: 'DEP-001', name: 'Fútbol', category: 'Balón', description: 'Deporte de equipo jugado entre dos conjuntos de once jugadores cada uno.', status: 'activo', createdAt: '2024-01-15' },
  { key: 'baloncesto', code: 'DEP-002', name: 'Baloncesto', category: 'Balón', description: 'Deporte de equipo en el que se anota encestando el balón.', status: 'activo', createdAt: '2024-02-02' },
  { key: 'voleibol', code: 'DEP-003', name: 'Voleibol', category: 'Red', description: 'Deporte de equipo separado por una red, sin dejar caer el balón.', status: 'activo', createdAt: '2024-02-18' },
  { key: 'tenis', code: 'DEP-004', name: 'Tenis', category: 'Raqueta', description: 'Deporte de raqueta disputado en individual o dobles.', status: 'inactivo', createdAt: '2024-03-04' },
  { key: 'natacion', code: 'DEP-005', name: 'Natación', category: 'Acuática', description: 'Deporte de resistencia y técnica en el agua.', status: 'activo', createdAt: '2024-03-20' },
  { key: 'futbol-11', code: 'DEP-006', name: 'Fútbol 11', category: 'Balón', description: 'Subdeporte de Fútbol.', status: 'activo', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-salon', code: 'DEP-007', name: 'Fútbol de salón', category: 'Balón', description: 'Subdeporte de Fútbol.', status: 'activo', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-callejero', code: 'DEP-008', name: 'Fútbol callejero', category: 'Balón', description: 'Subdeporte de Fútbol.', status: 'activo', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-playa', code: 'DEP-009', name: 'Fútbol playa', category: 'Balón', description: 'Subdeporte de Fútbol.', status: 'activo', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'futbol-5', code: 'DEP-010', name: 'Fútbol 5', category: 'Balón', description: 'Subdeporte de Fútbol.', status: 'activo', parent: 'futbol', createdAt: '2024-01-15' },
  { key: 'baloncesto-5', code: 'DEP-011', name: 'Baloncesto 5x5', category: 'Balón', description: 'Subdeporte de Baloncesto.', status: 'activo', parent: 'baloncesto', createdAt: '2024-02-02' },
  { key: 'baloncesto-3', code: 'DEP-012', name: 'Baloncesto 3x3', category: 'Balón', description: 'Subdeporte de Baloncesto.', status: 'activo', parent: 'baloncesto', createdAt: '2024-02-02' },
  { key: 'voleibol-pista', code: 'DEP-013', name: 'Voleibol de pista', category: 'Red', description: 'Subdeporte de Voleibol.', status: 'activo', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'voleibol-playa', code: 'DEP-014', name: 'Voleibol de playa', category: 'Red', description: 'Subdeporte de Voleibol.', status: 'activo', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'voleibol-sala', code: 'DEP-015', name: 'Voleibol de sala', category: 'Red', description: 'Subdeporte de Voleibol.', status: 'activo', parent: 'voleibol', createdAt: '2024-02-18' },
  { key: 'tenis-singles', code: 'DEP-016', name: 'Tenis individual', category: 'Raqueta', description: 'Subdeporte de Tenis.', status: 'inactivo', parent: 'tenis', createdAt: '2024-03-04' },
  { key: 'tenis-dobles', code: 'DEP-017', name: 'Tenis dobles', category: 'Raqueta', description: 'Subdeporte de Tenis.', status: 'inactivo', parent: 'tenis', createdAt: '2024-03-04' },
  { key: 'natacion-libre', code: 'DEP-018', name: 'Natación libre', category: 'Acuática', description: 'Subdeporte de Natación.', status: 'activo', parent: 'natacion', createdAt: '2024-03-20' },
];

const TEAMS = [
  { key: 'atletico', code: 'EQ-001', name: 'Atlético Manizales', shortName: 'Atl. Manizales', city: 'Manizales', description: 'Equipo de formación y competencia dedicado al desarrollo integral de atletas en diferentes disciplinas deportivas. Nuestro objetivo es potenciar el talento local y competir al más alto nivel.', status: 'activo', createdAt: '2022-03-15', color: '#e11d48' },
  { key: 'caldas', code: 'EQ-002', name: 'Deportivo Caldas', shortName: 'Dep. Caldas', city: 'Manizales', description: 'Club histórico de la región, con cantera propia y participación en varias disciplinas.', status: 'activo', createdAt: '2018-08-11', color: '#16a34a' },
  { key: 'titanes', code: 'EQ-003', name: 'Titanes FC', shortName: 'Titanes', city: 'Pereira', description: 'Equipo de competencia centrado en el fútbol formativo y el baloncesto.', status: 'activo', createdAt: '2019-04-02', color: '#f59e0b' },
  { key: 'andino', code: 'EQ-004', name: 'Real Andino', shortName: 'R. Andino', city: 'Armenia', description: 'Club en receso deportivo. Conserva su historial y sus disciplinas asociadas.', status: 'inactivo', createdAt: '2016-11-09', color: '#38bdf8' },
  { key: 'condores', code: 'EQ-005', name: 'Cóndores FC', shortName: 'Cóndores', city: 'Ibagué', description: 'Equipo regional con plantilla activa en fútbol y voleibol.', status: 'activo', createdAt: '2021-01-20', color: '#eab308' },
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
  { key: 'juan', fullName: 'Juan Pérez', document: '1.063.245.678', age: 24, nationality: 'Colombia', position: 'DEL', heightM: 1.8, dominantFoot: 'Derecho', status: 'activo', email: 'juan.perez@email.com', phone: '+57 300 123 4567', sport: 'futbol', matches: 28, goals: 16, assists: 7, rating: 7.45 },
  { key: 'andres', fullName: 'Andrés Rojas', document: '1.012.345.890', age: 27, nationality: 'Colombia', position: 'MC', heightM: 1.76, dominantFoot: 'Derecho', status: 'activo', email: 'andres.rojas@email.com', phone: '+57 301 222 3344', sport: 'futbol', matches: 31, goals: 6, assists: 11, rating: 7.1 },
  { key: 'miguel', fullName: 'Miguel Torres', document: '1.075.654.321', age: 22, nationality: 'Colombia', position: 'DEF', heightM: 1.83, dominantFoot: 'Izquierdo', status: 'activo', email: 'miguel.torres@email.com', phone: '+57 302 555 0199', sport: 'futbol', matches: 22, goals: 1, assists: 3, rating: 6.8 },
  { key: 'daniel', fullName: 'Daniel Castro', document: '1.030.987.654', age: 28, nationality: 'Colombia', position: 'POR', heightM: 1.88, dominantFoot: 'Derecho', status: 'inactivo', email: 'daniel.castro@email.com', phone: '+57 304 111 9088', sport: 'futbol', matches: 18, goals: 0, assists: 0, rating: 6.9 },
  { key: 'felipe', fullName: 'Felipe Gómez', document: '1.098.765.432', age: 26, nationality: 'Colombia', position: 'DEL', heightM: 1.79, dominantFoot: 'Ambos', status: 'activo', email: 'felipe.gomez@email.com', phone: '+57 305 444 2211', sport: 'futbol', matches: 19, goals: 8, assists: 2, rating: 7.0 },
  { key: 'carlos', fullName: 'Carlos Ruiz', document: '1.055.333.210', age: 29, nationality: 'España', position: 'MC', heightM: 1.77, dominantFoot: 'Derecho', status: 'activo', email: 'carlos.ruiz@email.com', phone: '+57 300 888 1212', sport: 'futbol', matches: 24, goals: 4, assists: 9, rating: 7.2 },
  { key: 'david', fullName: 'David Torres', document: '1.044.222.109', age: 30, nationality: 'Argentina', position: 'DEF', heightM: 1.84, dominantFoot: 'Derecho', status: 'activo', email: 'david.torres@email.com', phone: '+57 310 666 4545', sport: 'futbol', matches: 40, goals: 2, assists: 1, rating: 6.6 },
  { key: 'laura', fullName: 'Laura Méndez', document: '1.099.111.222', age: 21, nationality: 'Colombia', position: 'MC', heightM: 1.68, dominantFoot: 'Izquierdo', status: 'activo', email: 'laura.mendez@email.com', phone: '+57 311 777 3030', sport: 'voleibol', matches: 0, goals: 0, assists: 0, rating: 0 },
];

const CONTRACTS = [
  { player: 'juan', team: 'atletico', startDate: '2026-01-01', endDate: '2027-12-31', status: 'activo', endReason: null, detail: null },
  { player: 'carlos', team: 'atletico', startDate: '2026-02-15', endDate: '2027-02-15', status: 'activo', endReason: null, detail: null },
  { player: 'daniel', team: 'atletico', startDate: '2026-01-10', endDate: '2028-01-10', status: 'activo', endReason: null, detail: null },
  { player: 'andres', team: 'caldas', startDate: '2025-07-01', endDate: '2027-06-30', status: 'activo', endReason: null, detail: null },
  { player: 'miguel', team: 'titanes', startDate: '2025-01-15', endDate: '2026-12-15', status: 'activo', endReason: null, detail: null },
  { player: 'felipe', team: 'condores', startDate: '2025-08-01', endDate: '2027-08-01', status: 'activo', endReason: null, detail: null },
  { player: 'david', team: 'atletico', startDate: '2023-01-01', endDate: '2025-12-15', status: 'finalizado', endReason: 'Transferido', detail: 'Transferido a Deportivo Caldas' },
  { player: 'miguel', team: 'atletico', startDate: '2022-01-01', endDate: '2024-11-30', status: 'finalizado', endReason: 'Finalizó contrato', detail: 'Fin del contrato acordado' },
  { player: 'felipe', team: 'atletico', startDate: '2021-02-01', endDate: '2023-06-30', status: 'finalizado', endReason: 'Transferido', detail: 'Transferido a Cóndores FC' },
];

const SKILLS = [
  { key: 'velocidad', name: 'Velocidad', category: 'Física', description: 'Capacidad del jugador para desplazarse rápidamente.', glyph: 'run' },
  { key: 'regate', name: 'Regate', category: 'Técnica', description: 'Habilidad para eludir rivales con el balón.', glyph: 'ball' },
  { key: 'definicion', name: 'Definición', category: 'Técnica', description: 'Eficacia y precisión al finalizar jugadas.', glyph: 'target' },
  { key: 'resistencia', name: 'Resistencia', category: 'Física', description: 'Mantiene el rendimiento durante todo el partido.', glyph: 'heart' },
  { key: 'pase', name: 'Pase', category: 'Técnica', description: 'Precisión y calidad en distintos tipos de pase.', glyph: 'pass' },
  { key: 'defensa', name: 'Defensa', category: 'Táctica', description: 'Anticipación, marca y capacidad de recuperación.', glyph: 'shield' },
  { key: 'vision', name: 'Visión de juego', category: 'Táctica', description: 'Lee el juego y toma mejores decisiones en el campo.', glyph: 'eye' },
  { key: 'liderazgo', name: 'Liderazgo', category: 'Mental', description: 'Influencia positiva y liderazgo dentro y fuera del campo.', glyph: 'crown' },
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
      manager.create(Deporte, {
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
      manager.create(Deporte, {
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
      manager.create(Equipo, {
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
    EquipoDeporte,
    LINKS.map(([team, sport]) =>
      manager.create(EquipoDeporte, { equipoId: teams.get(team), deporteId: sports.get(sport) }),
    ),
  );

  const players = new Map<string, number>();
  for (const player of PLAYERS) {
    const saved = await manager.save(
      manager.create(Jugador, {
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
    Vinculacion,
    CONTRACTS.map((contract) => {
      const jugadorId = players.get(contract.player);
      return manager.create(Vinculacion, {
        jugadorId,
        equipoId: teams.get(contract.team),
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        endReason: contract.endReason,
        detail: contract.detail,
        activePlayerKey: contract.status === 'activo' ? jugadorId : null,
      });
    }),
  );

  const skills = new Map<string, number>();
  for (const skill of SKILLS) {
    const saved = await manager.save(
      manager.create(Habilidad, {
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
    JugadorHabilidad,
    PLAYER_SKILLS.map(([player, skill, score]) =>
      manager.create(JugadorHabilidad, {
        jugadorId: players.get(player),
        habilidadId: skills.get(skill),
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
    const existing = await this.dataSource.getRepository(Deporte).count();
    if (existing > 0) return;
    await this.dataSource.transaction((manager) => seedCatalog(manager));
    this.logger.log('Catálogo deportivo de ejemplo cargado.');
  }
}
