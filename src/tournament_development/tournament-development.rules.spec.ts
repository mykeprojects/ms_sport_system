import { computeGroupStandings, buildKnockoutRounds } from './tournament-development.rules';

describe('tournament-development.rules', () => {
  const teamsById = new Map([
    [1, { id: 1, name: 'Alpha' }],
    [2, { id: 2, name: 'Beta' }],
    [3, { id: 3, name: 'Gamma' }],
  ]);

  const baseMatch = (overrides: Record<string, any>) => ({
    id: 1,
    groupId: 10,
    bracketId: null,
    homeTeamId: 1,
    awayTeamId: 2,
    status: 'FINISHED',
    officialResult: 'HOME',
    startsAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  });

  it('computes initial standings with zeroed stats when there are no finished matches', () => {
    const result = computeGroupStandings(
      { id: 10, name: 'Grupo A', groupOrder: 1, maxTeams: null, teamIds: [1, 2] },
      teamsById as any,
      [],
    );

    expect(result.standings).toHaveLength(2);
    expect(result.standings[0]).toMatchObject({
      team: { id: 1, name: 'Alpha' },
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: 1,
    });
    expect(result.standings[1]).toMatchObject({ team: { id: 2, name: 'Beta' }, points: 0, position: 2 });
  });

  it('accumulates played, won, drawn, lost and points from finished group matches', () => {
    const matches = [
      baseMatch({ id: 1, homeTeamId: 1, awayTeamId: 2, officialResult: 'HOME' }),
      baseMatch({ id: 2, homeTeamId: 2, awayTeamId: 1, officialResult: 'DRAW' }),
      baseMatch({ id: 3, homeTeamId: 1, awayTeamId: 2, officialResult: 'AWAY' }),
    ];

    const result = computeGroupStandings(
      { id: 10, name: 'Grupo A', groupOrder: 1, maxTeams: null, teamIds: [1, 2] },
      teamsById as any,
      matches as any,
    );

    const alpha = result.standings.find((row) => row.team.id === 1)!;
    const beta = result.standings.find((row) => row.team.id === 2)!;

    expect(alpha).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, points: 4 });
    expect(beta).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, points: 4 });
  });

  it('ignores void, cancelled and non-finished matches', () => {
    const matches = [
      baseMatch({ id: 1, officialResult: 'VOID' }),
      baseMatch({ id: 2, status: 'CANCELLED', officialResult: 'HOME' }),
      baseMatch({ id: 3, status: 'SCHEDULED', officialResult: null }),
      baseMatch({ id: 4, status: 'IN_PROGRESS', officialResult: null }),
    ];

    const result = computeGroupStandings(
      { id: 10, name: 'Grupo A', groupOrder: 1, maxTeams: null, teamIds: [1, 2] },
      teamsById as any,
      matches as any,
    );

    expect(result.standings.every((row) => row.played === 0 && row.points === 0)).toBe(true);
  });

  it('orders standings by points and then by team name when criteria tie', () => {
    const matches = [baseMatch({ id: 1, homeTeamId: 3, awayTeamId: 2, officialResult: 'HOME' })];
    const result = computeGroupStandings(
      { id: 10, name: 'Grupo A', groupOrder: 1, maxTeams: null, teamIds: [1, 2, 3] },
      teamsById as any,
      matches as any,
    );

    expect(result.standings.map((row) => [row.position, row.team.id])).toEqual([
      [1, 3],
      [2, 1],
      [3, 2],
    ]);
  });

  it('builds knockout rounds with linked match and null next matchup', () => {
    const brackets = [
      { id: 5, phaseId: 7, roundType: 'FINAL', bracketOrder: 1, teamAId: 1, teamBId: 2, winnerTeamId: 1, status: 'FINISHED' },
    ];
    const matches = [baseMatch({ id: 99, groupId: null, bracketId: 5, homeTeamId: 1, awayTeamId: 2, officialResult: 'HOME' })];

    const rounds = buildKnockoutRounds(brackets as any, teamsById as any, matches as any);

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ roundType: 'FINAL', label: 'Final' });
    expect(rounds[0].matchups[0]).toMatchObject({
      bracketId: 5,
      status: 'FINISHED',
      teamA: { id: 1, name: 'Alpha' },
      teamB: { id: 2, name: 'Beta' },
      winnerTeam: { id: 1, name: 'Alpha' },
      nextMatchup: null,
    });
    expect(rounds[0].matchups[0].match).toMatchObject({ id: 99, officialResult: 'HOME' });
  });
});
