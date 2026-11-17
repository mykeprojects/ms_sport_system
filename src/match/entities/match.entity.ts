import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { MatchStatus, OfficialResult } from '../match.constants';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'home_team', type: 'varchar', length: 120 })
  homeTeam: string;

  @Column({ name: 'away_team', type: 'varchar', length: 120 })
  awayTeam: string;

  /** Optional link to the existing sport catalog. */
  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId: number | null;

  @Column({ name: 'scheduled_at', type: 'datetime', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'starts_at', type: 'datetime' })
  startsAt: Date;

  /** Deadline for placing bets; never after `startsAt`. */
  @Column({ name: 'betting_closes_at', type: 'datetime' })
  bettingClosesAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status: MatchStatus;

  @Column({ name: 'betting_enabled', type: 'boolean', default: true })
  bettingEnabled: boolean;

  @Column({ name: 'official_result', type: 'varchar', length: 10, nullable: true })
  officialResult: OfficialResult | null;

  @Column({
    name: 'home_odd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  homeOdd: number;

  @Column({
    name: 'away_odd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  awayOdd: number;

  @Column({
    name: 'draw_odd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  drawOdd: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
