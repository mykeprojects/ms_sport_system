import { RandomMatchTrackingSimulator } from './random-match-tracking.simulator';
import { MatchTrackingService } from './match-tracking.service';
import type {
  MatchTrackingPositionStore,
  MatchTrackingPublisher,
  MatchTrackingSimulator,
} from './match-tracking.ports';
import type { TrackingBoard } from './match-tracking.types';
import type { CatalogStore } from '../../catalog/catalog.store';
import type { MatchService } from '../match.service';

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

describe('MatchTrackingService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores and publishes simulated positions automatically after tracking starts', async () => {
    jest.useFakeTimers();
    const board: TrackingBoard = {
      matchId: 1,
      sessionId: 1,
      sportId: 1,
      sportName: 'Fútbol',
      playersPerTeam: 1,
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
    const store = {
      start: jest.fn().mockResolvedValue(board),
      findSession: jest.fn().mockResolvedValue(board),
      updatePlayer: jest.fn().mockResolvedValue({
        matchId: 1,
        subjectType: 'PLAYER',
        playerId: 100,
        x: 53,
        y: 34,
        recordedAt: '2026-11-18T18:00:00.000Z',
      }),
      updateBall: jest.fn().mockResolvedValue({
        matchId: 1,
        subjectType: 'BALL',
        ballId: 1,
        x: 54,
        y: 34,
        recordedAt: '2026-11-18T18:00:00.000Z',
      }),
    };
    const publisher = { publish: jest.fn() };
    const service = new MatchTrackingService(
      { getEntity: jest.fn().mockResolvedValue({ status: 'IN_PROGRESS', sportId: 1 }) } as unknown as MatchService,
      { load: jest.fn().mockResolvedValue({ sports: [{ id: 1, name: 'Fútbol' }] }) } as unknown as CatalogStore,
      store as unknown as MatchTrackingPositionStore,
      {
        next: jest.fn().mockReturnValue({
          players: new Map([[100, { x: 53, y: 34 }]]),
          ball: { x: 54, y: 34 },
        }),
      } as MatchTrackingSimulator,
      publisher as unknown as MatchTrackingPublisher,
    );

    await service.start(1, { simulationIntervalMs: 100 });
    await jest.advanceTimersByTimeAsync(100);

    expect(store.updatePlayer).toHaveBeenCalledWith(1, 100, 53, 34);
    expect(store.updateBall).toHaveBeenCalledWith(1, 54, 34);
    expect(publisher.publish).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ subjectType: 'PLAYER', playerId: 100, x: 53, y: 34 }),
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ subjectType: 'BALL', ballId: 1, x: 54, y: 34 }),
    );

    service.onModuleDestroy();
  });

  it('does not publish positions while paused and resumes updates on demand', async () => {
    jest.useFakeTimers();
    const board: TrackingBoard = {
      matchId: 1,
      sessionId: 1,
      sportId: 1,
      sportName: 'Fútbol',
      playersPerTeam: 1,
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
    let currentBoard = board;
    const store = {
      start: jest.fn().mockImplementation(async () => currentBoard),
      findSession: jest.fn().mockImplementation(async () => currentBoard),
      updatePlayer: jest.fn().mockResolvedValue({
        matchId: 1,
        subjectType: 'PLAYER',
        playerId: 100,
        x: 53,
        y: 34,
        recordedAt: '2026-11-18T18:00:00.000Z',
      }),
      updateBall: jest.fn().mockResolvedValue({
        matchId: 1,
        subjectType: 'BALL',
        ballId: 1,
        x: 54,
        y: 34,
        recordedAt: '2026-11-18T18:00:00.000Z',
      }),
      pause: jest.fn().mockImplementation(async () => {
        currentBoard = { ...currentBoard, status: 'PAUSED' };
        return currentBoard;
      }),
      resume: jest.fn().mockImplementation(async () => {
        currentBoard = { ...currentBoard, status: 'RUNNING' };
        return currentBoard;
      }),
      stop: jest.fn(),
    };
    const publisher = { publish: jest.fn() };
    const service = new MatchTrackingService(
      { getEntity: jest.fn().mockResolvedValue({ status: 'IN_PROGRESS', sportId: 1 }) } as unknown as MatchService,
      { load: jest.fn().mockResolvedValue({ sports: [{ id: 1, name: 'Fútbol' }] }) } as unknown as CatalogStore,
      store as unknown as MatchTrackingPositionStore,
      {
        next: jest.fn().mockReturnValue({
          players: new Map([[100, { x: 53, y: 34 }]]),
          ball: { x: 54, y: 34 },
        }),
      } as MatchTrackingSimulator,
      publisher as unknown as MatchTrackingPublisher,
    );

    await service.start(1, { simulationIntervalMs: 100 });
    await jest.advanceTimersByTimeAsync(100);
    const updatesBeforePause = store.updatePlayer.mock.calls.length;

    await service.pause(1);
    publisher.publish.mockClear();
    await jest.advanceTimersByTimeAsync(500);

    expect(store.updatePlayer).toHaveBeenCalledTimes(updatesBeforePause);
    expect(store.updateBall).toHaveBeenCalledTimes(updatesBeforePause);
    expect(publisher.publish).not.toHaveBeenCalled();

    await service.resume(1);
    publisher.publish.mockClear();
    await jest.advanceTimersByTimeAsync(100);

    expect(store.updatePlayer.mock.calls.length).toBeGreaterThan(updatesBeforePause);
    expect(publisher.publish).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ subjectType: 'PLAYER', playerId: 100 }),
    );

    service.onModuleDestroy();
  });
});
