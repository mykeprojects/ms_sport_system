import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { MatchTrackingPublisher } from './match-tracking.ports';
import type { PositionUpdate, TrackingBoard } from './match-tracking.types';

@Injectable()
@WebSocketGateway({ namespace: '/tracking', cors: { origin: '*' } })
export class MatchTrackingGateway extends MatchTrackingPublisher {
  @WebSocketServer()
  server!: Server;

  publish(matchId: number, event: PositionUpdate | TrackingBoard): void {
    this.server?.to(`match:${matchId}`).emit('tracking:update', event);
  }

  @SubscribeMessage('tracking:join')
  join(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: number },
  ): { room: string } {
    const room = `match:${Number(payload.matchId)}`;
    void client.join(room);
    return { room };
  }

  @SubscribeMessage('tracking:leave')
  leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: number },
  ): { room: string } {
    const room = `match:${Number(payload.matchId)}`;
    void client.leave(room);
    return { room };
  }
}
