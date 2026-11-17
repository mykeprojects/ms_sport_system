import { buildProfile } from './catalog.queries';
import type { CatalogState } from './catalog.types';

describe('profile deportivo', () => {
  const state: CatalogState = {
    sports: [],
    teams: [{ id: 1, code: 'EQ-001', name: 'Atlético Manizales', shortName: 'Atl.', city: 'Manizales', description: '', status: 'active', createdAt: '2022-03-15', color: '#e11d48' }],
    teamSports: [],
    players: [
      {
        id: 1,
        fullName: 'Juan Pérez',
        document: '1',
        age: 24,
        nationality: 'Colombia',
        position: 'DEL',
        heightM: 1.8,
        dominantFoot: 'Derecho',
        status: 'active',
        email: '',
        phone: '',
        preferredSportId: null,
        stats: { matches: 28, goals: 16, assists: 7, rating: 7.45 },
      },
      {
        id: 2,
        fullName: 'Laura Méndez',
        document: '2',
        age: 21,
        nationality: 'Colombia',
        position: 'MC',
        heightM: 1.68,
        dominantFoot: 'Izquierdo',
        status: 'active',
        email: '',
        phone: '',
        preferredSportId: null,
        stats: { matches: 0, goals: 0, assists: 0, rating: 0 },
      },
    ],
    contracts: [
      { id: 1, playerId: 1, teamId: 1, startDate: '2026-01-01', endDate: '2027-12-31', status: 'active', endReason: null, detail: null },
    ],
    skills: [
      { id: 1, name: 'Velocidad', category: 'Physical', description: '', glyph: 'run' },
      { id: 2, name: 'Definición', category: 'Technical', description: '', glyph: 'target' },
      { id: 3, name: 'Pase', category: 'Technical', description: '', glyph: 'pass' },
      { id: 4, name: 'Defensa', category: 'Tactical', description: '', glyph: 'shield' },
      { id: 5, name: 'Regate', category: 'Technical', description: '', glyph: 'ball' },
      { id: 6, name: 'Resistencia', category: 'Physical', description: '', glyph: 'heart' },
    ],
    playerSkills: [
      { playerId: 1, skillId: 1, score: 91 },
      { playerId: 1, skillId: 5, score: 88 },
      { playerId: 1, skillId: 2, score: 84 },
      { playerId: 1, skillId: 6, score: 86 },
      { playerId: 1, skillId: 3, score: 78 },
      { playerId: 1, skillId: 4, score: 55 },
    ],
  };

  it('resume el radar y la media del player', () => {
    const profile = buildProfile(state, 1);
    expect(profile?.media).toBe(80);
    expect(profile?.radar).toEqual([
      { axis: 'Speed', score: 91 },
      { axis: 'Shooting', score: 84 },
      { axis: 'Passing', score: 78 },
      { axis: 'Defense', score: 55 },
      { axis: 'Dribbling', score: 88 },
      { axis: 'Physical', score: 86 },
    ]);
    expect(profile?.messages.teams).toBeNull();
    expect(profile?.currentContract?.team).toMatchObject({ name: 'Atlético Manizales' });
  });

  it('explica cuando el player no tiene teams ni skills', () => {
    const profile = buildProfile(state, 2);
    expect(profile?.messages).toEqual({
      teams: 'Este player no tiene teams associated.',
      skills: 'Este player no tiene skills registradas.',
    });
    expect(profile?.media).toBeNull();
  });
});
