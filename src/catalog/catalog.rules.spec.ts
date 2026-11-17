import {
  assignContract,
  assignSkill,
  associateSport,
  deletePlayer,
  deleteSkill,
  deleteSport,
  deleteTeam,
  releasePlayer,
  savePlayer,
  saveSport,
  updateContract,
} from './catalog.rules';
import type { CatalogState, PlayerRecord, SportRecord, TeamRecord } from './catalog.types';

const clock = () => '2026-11-15';

function catalog(partial: Partial<CatalogState> = {}): CatalogState {
  return {
    sports: [],
    teams: [],
    teamSports: [],
    players: [],
    contracts: [],
    skills: [],
    playerSkills: [],
    ...partial,
  };
}

function sport(partial: Partial<SportRecord> & Pick<SportRecord, 'id' | 'name'>): SportRecord {
  return {
    code: `DEP-00${partial.id}`,
    category: 'Ball',
    description: '',
    status: 'active',
    parentId: null,
    createdAt: '2024-01-15',
    ...partial,
  };
}

function team(partial: Partial<TeamRecord> & Pick<TeamRecord, 'id' | 'name'>): TeamRecord {
  return {
    code: `EQ-00${partial.id}`,
    shortName: partial.name,
    city: 'Manizales',
    description: '',
    status: 'active',
    createdAt: '2024-01-15',
    color: '#3dff7a',
    ...partial,
  };
}

function player(partial: Partial<PlayerRecord> & Pick<PlayerRecord, 'id' | 'fullName'>): PlayerRecord {
  return {
    document: `${partial.id}.000`,
    age: 20,
    nationality: 'Colombia',
    position: 'MC',
    heightM: 1.75,
    dominantFoot: 'Derecho',
    status: 'active',
    email: '',
    phone: '',
    preferredSportId: null,
    stats: { matches: 0, goals: 0, assists: 0, rating: 0 },
    ...partial,
  };
}

describe('reglas del catálogo deportivo', () => {
  const base = catalog({
    sports: [sport({ id: 1, name: 'Fútbol' }), sport({ id: 6, name: 'Fútbol 11', parentId: 1 })],
    teams: [team({ id: 1, name: 'Atlético Manizales' }), team({ id: 2, name: 'Deportivo Caldas' })],
    teamSports: [{ teamId: 1, sportId: 1 }],
    players: [player({ id: 1, fullName: 'Juan Pérez' }), player({ id: 2, fullName: 'Laura Méndez' })],
    contracts: [
      {
        id: 1,
        playerId: 1,
        teamId: 1,
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        status: 'active',
        endReason: null,
        detail: null,
      },
    ],
    skills: [
      { id: 1, name: 'Velocidad', category: 'Physical', description: 'Ritmo', glyph: 'run' },
    ],
    playerSkills: [{ playerId: 1, skillId: 1, score: 91 }],
  });

  it('rechaza un sport con el mismo nombre', () => {
    const result = saveSport(base, {
      name: 'fútbol',
      category: 'Ball',
      description: '',
      status: 'active',
      subsports: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe('A sport with this name already exists.');
  });

  it('registra un sport con su subsport', () => {
    const result = saveSport(base, {
      name: 'Atletismo',
      category: 'Atlética',
      description: 'Pista',
      status: 'active',
      subsports: ['Marcha'],
    }, clock);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const created = result.state.sports.find((item) => item.name === 'Atletismo');
    expect(created?.code).toBe('DEP-007');
    expect(result.state.sports.some((item) => item.name === 'Marcha' && item.parentId === created?.id)).toBe(true);
  });

  it('no elimina un sport con teams associated ni quita un subsport vinculado', () => {
    const removed = deleteSport(base, 1);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.message).toContain('teams are associated');

    const linked = catalog({
      ...base,
      teamSports: [{ teamId: 1, sportId: 6 }],
    });
    const update = saveSport(linked, {
      id: 1,
      name: 'Fútbol',
      category: 'Ball',
      description: '',
      status: 'active',
      subsports: [],
    });
    expect(update.ok).toBe(false);
    if (!update.ok) expect(update.message).toContain('Fútbol 11');
  });

  it('no repite la asociación de un sport', () => {
    const result = associateSport(base, 1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe('This sport is already associated with the team.');
  });

  it('no elimina un team con players ni uno que solo tenga sports', () => {
    const withPlayers = deleteTeam(base, 1);
    expect(withPlayers.ok).toBe(false);
    if (!withPlayers.ok) expect(withPlayers.message).toContain('players');

    const onlySports = deleteTeam(
      catalog({ ...base, contracts: [], teamSports: [{ teamId: 2, sportId: 1 }] }),
      2,
    );
    expect(onlySports.ok).toBe(false);
    if (!onlySports.ok) expect(onlySports.message).toContain('Remove the associations');
  });

  it('conserva el historial al bloquear el borrado de un player y permite borrar a quien no tiene teams', () => {
    const blocked = deletePlayer(base, 1);
    expect(blocked.ok).toBe(false);
    const removed = deletePlayer(
      catalog({ ...base, playerSkills: [...base.playerSkills, { playerId: 2, skillId: 1, score: 70 }] }),
      2,
    );
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.state.players.some((item) => item.id === 2)).toBe(false);
    expect(removed.state.playerSkills.some((item) => item.playerId === 2)).toBe(false);
    expect(removed.state.skills).toHaveLength(1);
  });

  it('impide una segunda vinculación activa y distingue el mismo team de otro', () => {
    const sameTeam = assignContract(base, {
      playerId: 1,
      teamId: 1,
      startDate: '2026-11-15',
      endDate: '2027-11-15',
    });
    expect(sameTeam.ok).toBe(false);
    if (!sameTeam.ok) expect(sameTeam.message).toBe('This player is already associated with the team.');

    const otherTeam = assignContract(base, {
      playerId: 1,
      teamId: 2,
      startDate: '2026-11-15',
      endDate: '2027-11-15',
    });
    expect(otherTeam.ok).toBe(false);
    if (!otherTeam.ok) expect(otherTeam.message).toContain('Release the current roster assignment');
  });

  it('al cambiar el team cierra el contrato anterior y abre uno nuevo', () => {
    const result = savePlayer(
      base,
      {
        id: 1,
        fullName: 'Juan Pérez',
        document: '1.000',
        age: 24,
        nationality: 'Colombia',
        position: 'DEL',
        heightM: 1.8,
        dominantFoot: 'Derecho',
        status: 'active',
        email: 'juan@email.com',
        phone: '',
        preferredSportId: 1,
        teamId: 2,
        syncTeam: true,
      },
      clock(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const previous = result.state.contracts.find((contract) => contract.id === 1);
    const opened = result.state.contracts.find((contract) => contract.id < 0);
    expect(previous).toMatchObject({ status: 'finished', endReason: 'Transferred', endDate: '2026-11-15' });
    expect(opened).toMatchObject({ teamId: 2, status: 'active', startDate: '2026-11-15', endDate: '2027-11-15' });
  });

  it('retira la roster, finaliza un contrato vencido y calcula el puntaje de la skill', () => {
    const released = releasePlayer(base, 1, 'Transferido', 'Salida pactada', clock());
    expect(released.ok).toBe(true);
    if (released.ok) {
      expect(released.state.contracts[0]).toMatchObject({ status: 'finished', endReason: 'Transferido', detail: 'Salida pactada' });
    }

    const expired = updateContract(base, 1, '2026-01-01', '2026-10-01', clock());
    expect(expired.ok).toBe(true);
    if (expired.ok) {
      expect(expired.state.contracts[0]).toMatchObject({
        status: 'finished',
        endReason: 'Contract completed',
        detail: 'Agreed contract completion',
      });
    }

    const assigned = assignSkill(base, 2, 1);
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) return;
    const link = assigned.state.playerSkills.find((item) => item.playerId === 2);
    const seed = '2:1'.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    expect(link?.score).toBe(68 + (seed % 28));
  });

  it('no elimina una skill assigned y rechaza edad o correo inválidos', () => {
    const skill = deleteSkill(base, 1);
    expect(skill.ok).toBe(false);
    if (!skill.ok) expect(skill.message).toContain('1 player');

    const young = savePlayer(base, {
      fullName: 'Nuevo',
      document: '9.999',
      age: 14,
      nationality: 'Colombia',
      position: 'DEL',
      heightM: 1.7,
      dominantFoot: 'Derecho',
      status: 'active',
      email: '',
      phone: '',
      syncTeam: false,
    });
    expect(young.ok).toBe(false);

    const email = savePlayer(base, {
      fullName: 'Nuevo',
      document: '9.999',
      age: 18,
      nationality: 'Colombia',
      position: 'DEL',
      heightM: 1.7,
      dominantFoot: 'Derecho',
      status: 'active',
      email: 'sin-arroba',
      phone: '',
      syncTeam: false,
    });
    expect(email.ok).toBe(false);
    if (!email.ok) expect(email.message).toBe('Email format is invalid.');
  });
});
