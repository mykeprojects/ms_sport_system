import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('match_tracking_sessions')
export class MatchTrackingSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id', type: 'int', unique: true })
  matchId: number;

  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId: number | null;

  @Column({ name: 'sport_name', length: 120 })
  sportName: string;

  @Column({ name: 'players_per_team', type: 'int' })
  playersPerTeam: number;

  @Column({ name: 'field_width', type: 'decimal', precision: 8, scale: 2 })
  fieldWidth: number;

  @Column({ name: 'field_height', type: 'decimal', precision: 8, scale: 2 })
  fieldHeight: number;

  @Column({ length: 20, default: 'RUNNING' })
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';

  @CreateDateColumn({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

@Entity('match_tracking_players')
export class MatchTrackingPlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @Column({ name: 'match_id', type: 'int' })
  matchId: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId: number;

  @Column({ name: 'side', length: 10 })
  side: 'HOME' | 'AWAY';

  @Column({ name: 'jersey_number', type: 'int' })
  jerseyNumber: number;

  @Column({ name: 'initial_x', type: 'decimal', precision: 8, scale: 2 })
  initialX: number;

  @Column({ name: 'initial_y', type: 'decimal', precision: 8, scale: 2 })
  initialY: number;
}

@Entity('match_tracking_balls')
export class MatchTrackingBall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', type: 'int', unique: true })
  sessionId: number;

  @Column({ name: 'match_id', type: 'int', unique: true })
  matchId: number;

  @Column({ length: 120, default: 'Pelota oficial' })
  name: string;

  @Column({ name: 'initial_x', type: 'decimal', precision: 8, scale: 2 })
  initialX: number;

  @Column({ name: 'initial_y', type: 'decimal', precision: 8, scale: 2 })
  initialY: number;
}

@Entity('match_tracking_positions')
export class MatchTrackingPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @Column({ name: 'match_id', type: 'int' })
  matchId: number;

  @Column({ name: 'subject_type', length: 10 })
  subjectType: 'PLAYER' | 'BALL';

  @Column({ name: 'player_id', type: 'int', nullable: true })
  playerId: number | null;

  @Column({ name: 'ball_id', type: 'int', nullable: true })
  ballId: number | null;

  @Column({ name: 'team_id', type: 'int', nullable: true })
  teamId: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  x: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  y: number;

  @Column({ name: 'sequence', type: 'bigint' })
  sequence: string;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamp' })
  recordedAt: Date;
}
