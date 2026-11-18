import { RandomMatchTrackingSimulator } from './random-match-tracking.simulator';
import type { TrackingBoard } from './match-tracking.types';

describe('RandomMatchTrackingSimulator', () => {
  const board: TrackingBoard = {
    matchId: 1,
    sessionId: 1,
    sportId: 1,
    sportName: 'Fútbol',
    playersPerTeam: 11,
    field: { width: 105, height: 68 },
    status: 'RUNNING',
    teams: [{
      side: 'HOME',
      teamId: 10,
      teamName: 'Local',
      color: '#2563eb',
      players: [{
        playerId: 100,
        name: 'Jugador',
        position: 'Delantero',
        jerseyNumber: 9,
        x: 52.5,
        y: 34,
      }],
    }],
    ball: { id: 1, name: 'Pelota oficial', x: 52.5, y: 34 },
  };

  it('keeps every simulated player and the ball within field boundaries', () => {
    const simulator = new RandomMatchTrackingSimulator();
    const next = simulator.next(board);
    const player = next.players.get(100);

    expect(player).toBeDefined();
    expect(player!.x).toBeGreaterThanOrEqual(0);
    expect(player!.x).toBeLessThanOrEqual(105);
    expect(player!.y).toBeGreaterThanOrEqual(0);
    expect(player!.y).toBeLessThanOrEqual(68);
    expect(next.ball.x).toBeGreaterThanOrEqual(0);
    expect(next.ball.x).toBeLessThanOrEqual(105);
    expect(next.ball.y).toBeGreaterThanOrEqual(0);
    expect(next.ball.y).toBeLessThanOrEqual(68);
  });
});
