import { Injectable } from '@nestjs/common';
import { MatchTrackingSimulator } from './match-tracking.ports';
import type { TrackingBoard } from './match-tracking.types';

@Injectable()
export class RandomMatchTrackingSimulator extends MatchTrackingSimulator {
  next(board: TrackingBoard): { players: Map<number, { x: number; y: number }>; ball: { x: number; y: number } } {
    const players = new Map<number, { x: number; y: number }>();
    for (const team of board.teams) {
      for (const player of team.players) {
        players.set(player.playerId, {
          x: this.clamp(player.x + this.randomStep(board.field.width), board.field.width),
          y: this.clamp(player.y + this.randomStep(board.field.height), board.field.height),
        });
      }
    }
    return {
      players,
      ball: {
        x: this.clamp(board.ball.x + this.randomStep(board.field.width), board.field.width),
        y: this.clamp(board.ball.y + this.randomStep(board.field.height), board.field.height),
      },
    };
  }

  private randomStep(size: number): number {
    return (Math.random() - 0.5) * size * 0.04;
  }

  private clamp(value: number, max: number): number {
    return Math.round(Math.max(0, Math.min(max, value)) * 100) / 100;
  }
}
