import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { BetSelection, BetStatus } from '../bet.constants';

/**
 * Association class: Match (n) — (n) Fan. It also points to the fan payment
 * method (FanPaymentMethod 1 — n Bet) used to place and settle the bet.
 */
@Entity('bets')
@Index(['matchId', 'settled'])
@Index(['fanId'])
export class Bet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id', type: 'int' })
  matchId: number;

  @Column({ name: 'fan_id', type: 'int' })
  fanId: number;

  @Column({ name: 'fan_payment_method_id', type: 'int' })
  fanPaymentMethodId: number;

  @Column({ type: 'varchar', length: 10 })
  selection: BetSelection;

  @Column({
    name: 'stake_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  stakeAmount: number;

  /** Odd frozen at creation time; never updated afterwards (HU). */
  @Column({
    name: 'locked_odd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  lockedOdd: number;

  @Column({ type: 'varchar', length: 20, default: 'REGISTERED' })
  status: BetStatus;

  @Column({
    name: 'settled_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  settledAmount: number;

  /** Guarantees a bet is settled at most once. */
  @Column({ type: 'boolean', default: false })
  settled: boolean;

  @Column({ name: 'settled_at', type: 'datetime', nullable: true })
  settledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
