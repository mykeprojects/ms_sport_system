import type { TrackingBoard, PositionUpdate } from './match-tracking.types';

export abstract class MatchTrackingPositionStore {
  abstract findSession(matchId: number): Promise<TrackingBoard | null>;
  abstract start(matchId: number, options: {
    sportId: number | null;
    sportName: string;
    playersPerTeam: number;
    fieldWidth: number;
    fieldHeight: number;
    ballName: string;
  }): Promise<TrackingBoard>;
  abstract updatePlayer(matchId: number, playerId: number, x: number, y: number): Promise<PositionUpdate>;
  abstract updateBall(matchId: number, x: number, y: number): Promise<PositionUpdate>;
  abstract history(matchId: number): Promise<PositionUpdate[]>;
  abstract pause(matchId: number): Promise<TrackingBoard>;
  abstract resume(matchId: number): Promise<TrackingBoard>;
  abstract stop(matchId: number): Promise<TrackingBoard>;
}

export abstract class MatchTrackingSimulator {
  abstract next(board: TrackingBoard): { players: Map<number, { x: number; y: number }>; ball: { x: number; y: number } };
}

export abstract class MatchTrackingPublisher {
  abstract publish(matchId: number, event: PositionUpdate | TrackingBoard): void;
}
