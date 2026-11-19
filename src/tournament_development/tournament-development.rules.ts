import type { Match } from '../match/entities/match.entity';
import type { OfficialResult } from '../match/match.constants';

export interface StandingTeamRef {
  id: number;
  name: string;
  shortName?: string | null;
  code?: string | null;
}

export interface StandingRow {
  position: number;
  team: StandingTeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStandingInput {
  id: number;
  name: string;
  groupOrder: number;
  maxTeams: number | null;
  teamIds: number[];
}

export interface GroupStandingsResult {
  id: number;
  name: string;
  groupOrder: number;
  maxTeams: number | null;
  standings: StandingRow[];
}

function isCountableResult(result: OfficialResult | null): result is 'HOME' | 'AWAY' | 'DRAW' {
  return result === 'HOME' || result === 'AWAY' || result === 'DRAW';
}

export function computeGroupStandings(
  group: GroupStandingInput,
  teamsById: Map<number, StandingTeamRef>,
  matches: Match[],
): GroupStandingsResult {
  const rows = new Map<number, StandingRow>();

  for (const teamId of group.teamIds) {
    const ref = teamsById.get(teamId) ?? { id: teamId, name: `Equipo #${teamId}` };
    rows.set(teamId, {
      position: 0,
      team: ref,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.groupId !== group.id) continue;
    if (match.status !== 'FINISHED' || !isCountableResult(match.officialResult)) continue;

    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    if (match.officialResult === 'HOME') {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.officialResult === 'AWAY') {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.name.localeCompare(b.team.name, 'es');
  });

  standings.forEach((row, index) => {
    row.position = index + 1;
  });

  return {
    id: group.id,
    name: group.name,
    groupOrder: group.groupOrder,
    maxTeams: group.maxTeams,
    standings,
  };
}

export type BracketLike = {
  id: number;
  phaseId: number;
  roundType: 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL';
  bracketOrder: number;
  teamAId: number | null;
  teamBId: number | null;
  winnerTeamId: number | null;
  status: 'PENDING' | 'FINISHED' | 'CANCELLED';
};

export interface KnockoutMatchup {
  bracketId: number;
  bracketOrder: number;
  roundType: 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL';
  status: string;
  teamA: StandingTeamRef | null;
  teamB: StandingTeamRef | null;
  winnerTeam: StandingTeamRef | null;
  nextMatchup: null;
  match: {
    id: number;
    status: string;
    officialResult: OfficialResult | null;
    startsAt: Date;
    homeTeamId: number;
    awayTeamId: number;
  } | null;
}

export interface KnockoutRound {
  roundType: 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL';
  label: string;
  matchups: KnockoutMatchup[];
}

const ROUND_ORDER: Record<KnockoutRound['roundType'], number> = {
  QUARTERFINAL: 1,
  SEMIFINAL: 2,
  FINAL: 3,
};

const ROUND_LABEL: Record<KnockoutRound['roundType'], string> = {
  QUARTERFINAL: 'Cuartos de final',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

export function buildKnockoutRounds(
  brackets: BracketLike[],
  teamsById: Map<number, StandingTeamRef>,
  matches: Match[],
): KnockoutRound[] {
  const byRound = new Map<KnockoutRound['roundType'], KnockoutMatchup[]>();

  for (const bracket of brackets) {
    const linked = matches
      .filter((match) => match.bracketId === bracket.id)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.id - b.id)[0];

    const matchup: KnockoutMatchup = {
      bracketId: bracket.id,
      bracketOrder: bracket.bracketOrder,
      roundType: bracket.roundType,
      status: bracket.status,
      teamA: bracket.teamAId == null ? null : teamsById.get(bracket.teamAId) ?? { id: bracket.teamAId, name: `Equipo #${bracket.teamAId}` },
      teamB: bracket.teamBId == null ? null : teamsById.get(bracket.teamBId) ?? { id: bracket.teamBId, name: `Equipo #${bracket.teamBId}` },
      winnerTeam:
        bracket.winnerTeamId == null
          ? null
          : teamsById.get(bracket.winnerTeamId) ?? { id: bracket.winnerTeamId, name: `Equipo #${bracket.winnerTeamId}` },
      nextMatchup: null,
      match: linked
        ? {
            id: linked.id,
            status: linked.status,
            officialResult: linked.officialResult,
            startsAt: linked.startsAt,
            homeTeamId: linked.homeTeamId,
            awayTeamId: linked.awayTeamId,
          }
        : null,
    };

    const list = byRound.get(bracket.roundType) ?? [];
    list.push(matchup);
    byRound.set(bracket.roundType, list);
  }

  return [...byRound.entries()]
    .sort((a, b) => ROUND_ORDER[a[0]] - ROUND_ORDER[b[0]])
    .map(([roundType, matchups]) => ({
      roundType,
      label: ROUND_LABEL[roundType],
      matchups: matchups.sort((a, b) => a.bracketOrder - b.bracketOrder || a.bracketId - b.bracketId),
    }));
}
