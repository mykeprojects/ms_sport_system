import { BadRequestException, ConflictException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CatalogStore } from '../../catalog/catalog.store';
import { MatchService } from '../match.service';
import type { StartMatchTrackingDto, UpdateBallPositionDto, UpdatePositionDto } from './dto/tracking.dto';
import {
  MatchTrackingPositionStore,
  MatchTrackingPublisher,
  MatchTrackingSimulator,
} from './match-tracking.ports';

@Injectable()
export class MatchTrackingService implements OnModuleDestroy {
  private readonly intervals = new Map<number, ReturnType<typeof setInterval>>();

  constructor(
    private readonly matches: MatchService,
    private readonly catalog: CatalogStore,
    private readonly store: MatchTrackingPositionStore,
    private readonly simulator: MatchTrackingSimulator,
    private readonly publisher: MatchTrackingPublisher,
  ) {}

  async board(matchId: number) {
    await this.matches.getEntity(matchId);
    const board = await this.store.findSession(matchId);
    if (!board) throw new BadRequestException('The match tracking session was not started.');
    return board;
  }

  async start(matchId: number, dto: StartMatchTrackingDto) {
    const match = await this.matches.getEntity(matchId);
    if (match.status === 'CANCELLED' || match.status === 'FINISHED') {
      throw new BadRequestException('Finished or cancelled matches cannot start spatial tracking.');
    }
    const state = await this.catalog.load();
    const sport = match.sportId == null ? null : state.sports.find((item) => item.id === match.sportId);
    const normalizedName = (sport?.name ?? '').toLocaleLowerCase('es');
    const playersPerTeam = dto.playersPerTeam ?? this.defaultPlayers(normalizedName);
    const field = dto.fieldWidth || dto.fieldHeight
      ? { width: dto.fieldWidth ?? 100, height: dto.fieldHeight ?? 60 }
      : this.defaultField(normalizedName);
    const board = await this.store.start(matchId, {
      sportId: match.sportId,
      sportName: sport?.name ?? 'Deporte',
      playersPerTeam,
      fieldWidth: field.width,
      fieldHeight: field.height,
      ballName: dto.ballName?.trim() || 'Pelota oficial',
    });
    if (board.status === 'STOPPED') {
      throw new ConflictException('The match tracking session is stopped.');
    }
    this.publisher.publish(matchId, board);
    this.startSimulation(matchId, dto.simulationIntervalMs ?? 1000);
    return board;
  }

  async updatePlayer(matchId: number, playerId: number, dto: UpdatePositionDto) {
    const update = await this.store.updatePlayer(matchId, playerId, dto.x, dto.y);
    this.publisher.publish(matchId, update);
    return this.store.findSession(matchId);
  }

  async updateBall(matchId: number, dto: UpdateBallPositionDto) {
    const update = await this.store.updateBall(matchId, dto.x, dto.y);
    this.publisher.publish(matchId, update);
    return this.store.findSession(matchId);
  }

  history(matchId: number) {
    return this.store.history(matchId);
  }

  async stop(matchId: number) {
    const board = await this.store.stop(matchId);
    this.clearSimulation(matchId);
    this.publisher.publish(matchId, board);
    return board;
  }

  onModuleDestroy(): void {
    for (const [matchId] of this.intervals) this.clearSimulation(matchId);
  }

  private startSimulation(matchId: number, intervalMs: number): void {
    this.clearSimulation(matchId);
    const interval = setInterval(() => {
      void this.simulate(matchId);
    }, intervalMs);
    this.intervals.set(matchId, interval);
  }

  private async simulate(matchId: number): Promise<void> {
    const board = await this.store.findSession(matchId);
    if (!board || board.status !== 'RUNNING') {
      this.clearSimulation(matchId);
      return;
    }
    const next = this.simulator.next(board);
    for (const [playerId, position] of next.players) {
      const update = await this.store.updatePlayer(matchId, playerId, position.x, position.y);
      this.publisher.publish(matchId, update);
    }
    const ball = await this.store.updateBall(matchId, next.ball.x, next.ball.y);
    this.publisher.publish(matchId, ball);
  }

  private clearSimulation(matchId: number): void {
    const interval = this.intervals.get(matchId);
    if (interval) clearInterval(interval);
    this.intervals.delete(matchId);
  }

  private defaultPlayers(sportName: string): number {
    if (sportName.includes('voleibol')) return 6;
    if (sportName.includes('micro') || sportName.includes('fútbol 5') || sportName.includes('futbol 5') || sportName.includes('fútbol de salón') || sportName.includes('futbol salon')) return 6;
    if (sportName.includes('fútbol') || sportName.includes('futbol')) return 11;
    return 5;
  }

  private defaultField(sportName: string): { width: number; height: number } {
    if (sportName.includes('voleibol')) return { width: 18, height: 9 };
    if (sportName.includes('fútbol') || sportName.includes('futbol')) return { width: 105, height: 68 };
    return { width: 100, height: 60 };
  }
}
