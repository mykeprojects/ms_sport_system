import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogStore } from '../../catalog/catalog.store';
import { Match } from '../entities/match.entity';
import { MatchTrackingPositionStore } from './match-tracking.ports';
import type { PositionUpdate, TrackingBoard } from './match-tracking.types';
import {
  MatchTrackingBall,
  MatchTrackingPlayer,
  MatchTrackingPosition,
  MatchTrackingSession,
} from './entities/match-tracking.entity';

@Injectable()
export class TypeOrmMatchTrackingStore extends MatchTrackingPositionStore {
  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(MatchTrackingSession) private readonly sessions: Repository<MatchTrackingSession>,
    @InjectRepository(MatchTrackingPlayer) private readonly trackingPlayers: Repository<MatchTrackingPlayer>,
    @InjectRepository(MatchTrackingBall) private readonly balls: Repository<MatchTrackingBall>,
    @InjectRepository(MatchTrackingPosition) private readonly positions: Repository<MatchTrackingPosition>,
    private readonly catalog: CatalogStore,
  ) {
    super();
  }

  async findSession(matchId: number): Promise<TrackingBoard | null> {
    const session = await this.sessions.findOne({ where: { matchId } });
    return session ? this.buildBoard(session) : null;
  }

  async start(matchId: number, options: {
    sportId: number | null;
    sportName: string;
    playersPerTeam: number;
    fieldWidth: number;
    fieldHeight: number;
    ballName: string;
  }): Promise<TrackingBoard> {
    const existing = await this.sessions.findOne({ where: { matchId } });
    if (existing) return this.buildBoard(existing);

    const match = await this.matches.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException(`Match #${matchId} was not found.`);

    const state = await this.catalog.load();
    const session = await this.sessions.save(this.sessions.create({
      matchId,
      sportId: options.sportId,
      sportName: options.sportName,
      playersPerTeam: options.playersPerTeam,
      fieldWidth: options.fieldWidth,
      fieldHeight: options.fieldHeight,
      status: 'RUNNING',
      endedAt: null,
    }));

    for (const side of ['HOME', 'AWAY'] as const) {
      const teamId = side === 'HOME' ? match.homeTeamId : match.awayTeamId;
      const activeContracts = state.contracts
        .filter((contract) => contract.teamId === teamId && contract.status === 'active')
        .slice(0, options.playersPerTeam);

      for (let index = 0; index < activeContracts.length; index++) {
        const contract = activeContracts[index];
        const row = index % 3;
        const column = Math.floor(index / 3);
        const xBase = side === 'HOME' ? options.fieldWidth * 0.22 : options.fieldWidth * 0.78;
        const x = Math.round((xBase + (side === 'HOME' ? column * 8 : -column * 8)) * 100) / 100;
        const y = Math.round(((row + 1) * options.fieldHeight / (activeContracts.length > 3 ? 4 : 2)) * 100) / 100;
        await this.trackingPlayers.save(this.trackingPlayers.create({
          sessionId: session.id,
          matchId,
          teamId,
          playerId: contract.playerId,
          side,
          jerseyNumber: index + 1,
          initialX: x,
          initialY: y,
        }));
        await this.positions.save(this.positions.create({
          sessionId: session.id,
          matchId,
          subjectType: 'PLAYER',
          playerId: contract.playerId,
          ballId: null,
          teamId,
          x,
          y,
          sequence: '1',
        }));
      }
    }

    const ball = await this.balls.save(this.balls.create({
      sessionId: session.id,
      matchId,
      name: options.ballName,
      initialX: options.fieldWidth / 2,
      initialY: options.fieldHeight / 2,
    }));
    await this.positions.save(this.positions.create({
      sessionId: session.id,
      matchId,
      subjectType: 'BALL',
      playerId: null,
      ballId: ball.id,
      teamId: null,
      x: ball.initialX,
      y: ball.initialY,
      sequence: '1',
    }));
    return this.buildBoard(session);
  }

  async updatePlayer(matchId: number, playerId: number, x: number, y: number): Promise<PositionUpdate> {
    const session = await this.requireRunning(matchId);
    const participant = await this.trackingPlayers.findOne({ where: { sessionId: session.id, playerId } });
    if (!participant) throw new NotFoundException('The player does not participate in this match tracking session.');
    this.assertFieldPosition(session, x, y);
    const recorded = await this.positions.save(this.positions.create({
      sessionId: session.id,
      matchId,
      subjectType: 'PLAYER',
      playerId,
      ballId: null,
      teamId: participant.teamId,
      x,
      y,
      sequence: await this.nextSequence(session.id),
    }));
    return this.toUpdate(recorded);
  }

  async updateBall(matchId: number, x: number, y: number): Promise<PositionUpdate> {
    const session = await this.requireRunning(matchId);
    this.assertFieldPosition(session, x, y);
    const ball = await this.balls.findOne({ where: { sessionId: session.id } });
    if (!ball) throw new NotFoundException('This match does not have a tracked ball.');
    const recorded = await this.positions.save(this.positions.create({
      sessionId: session.id,
      matchId,
      subjectType: 'BALL',
      playerId: null,
      ballId: ball.id,
      teamId: null,
      x,
      y,
      sequence: await this.nextSequence(session.id),
    }));
    return this.toUpdate(recorded);
  }

  async history(matchId: number): Promise<PositionUpdate[]> {
    const session = await this.sessions.findOne({ where: { matchId } });
    if (!session) throw new NotFoundException('The match tracking session was not started.');
    const rows = await this.positions.find({ where: { sessionId: session.id }, order: { id: 'ASC' } });
    return rows.map((row) => this.toUpdate(row));
  }

  async stop(matchId: number): Promise<TrackingBoard> {
    const session = await this.requireRunning(matchId);
    session.status = 'STOPPED';
    session.endedAt = new Date();
    await this.sessions.save(session);
    return this.buildBoard(session);
  }

  private async requireRunning(matchId: number): Promise<MatchTrackingSession> {
    const session = await this.sessions.findOne({ where: { matchId } });
    if (!session) throw new NotFoundException('The match tracking session was not started.');
    if (session.status !== 'RUNNING') throw new ConflictException('The match tracking session is stopped.');
    return session;
  }

  private assertFieldPosition(session: MatchTrackingSession, x: number, y: number): void {
    if (x < 0 || y < 0 || x > Number(session.fieldWidth) || y > Number(session.fieldHeight)) {
      throw new ConflictException('The position is outside the match field.');
    }
  }

  private async nextSequence(sessionId: number): Promise<string> {
    return String(await this.positions.count({ where: { sessionId } }) + 1);
  }

  private async buildBoard(session: MatchTrackingSession): Promise<TrackingBoard> {
    const state = await this.catalog.load();
    const match = await this.matches.findOne({ where: { id: session.matchId } });
    if (!match) throw new NotFoundException(`Match #${session.matchId} was not found.`);
    const ball = await this.balls.findOne({ where: { sessionId: session.id } });
    if (!ball) throw new NotFoundException('This tracking session does not have a ball.');
    const participantRows = await this.trackingPlayers.find({ where: { sessionId: session.id }, order: { id: 'ASC' } });
    const latest = await this.positions.find({ where: { sessionId: session.id }, order: { id: 'ASC' } });
    const teams = (['HOME', 'AWAY'] as const).map((side) => {
      const teamId = side === 'HOME' ? match.homeTeamId : match.awayTeamId;
      const team = state.teams.find((item) => item.id === teamId);
      const players = participantRows.filter((row) => row.side === side).map((row) => {
        const player = state.players.find((item) => item.id === row.playerId);
        const last = [...latest].reverse().find((position) => position.subjectType === 'PLAYER' && position.playerId === row.playerId);
        return {
          playerId: row.playerId,
          name: player?.fullName ?? `Jugador #${row.playerId}`,
          position: player?.position ?? 'Jugando',
          jerseyNumber: row.jerseyNumber,
          x: last ? Number(last.x) : Number(row.initialX),
          y: last ? Number(last.y) : Number(row.initialY),
        };
      });
      return {
        side,
        teamId,
        teamName: team?.name ?? (side === 'HOME' ? match.homeTeam : match.awayTeam),
        color: team?.color ?? (side === 'HOME' ? '#2563eb' : '#ef4444'),
        players,
      };
    });
    const ballPosition = [...latest].reverse().find((position) => position.subjectType === 'BALL');
    return {
      matchId: session.matchId,
      sessionId: session.id,
      sportId: session.sportId,
      sportName: session.sportName,
      playersPerTeam: session.playersPerTeam,
      field: { width: Number(session.fieldWidth), height: Number(session.fieldHeight) },
      status: session.status,
      teams,
      ball: {
        id: ball.id,
        name: ball.name,
        x: ballPosition ? Number(ballPosition.x) : Number(ball.initialX),
        y: ballPosition ? Number(ballPosition.y) : Number(ball.initialY),
      },
    };
  }

  private toUpdate(row: MatchTrackingPosition): PositionUpdate {
    return {
      matchId: row.matchId,
      subjectType: row.subjectType,
      playerId: row.playerId ?? undefined,
      ballId: row.ballId ?? undefined,
      teamId: row.teamId ?? undefined,
      x: Number(row.x),
      y: Number(row.y),
      recordedAt: row.recordedAt instanceof Date ? row.recordedAt.toISOString() : new Date().toISOString(),
    };
  }
}