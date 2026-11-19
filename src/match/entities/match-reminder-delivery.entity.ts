import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ReminderDeliveryStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'EXHAUSTED';

@Entity('match_reminder_deliveries')
@Index('uk_match_reminder_delivery_key', ['idempotencyKey'], { unique: true })
@Index('uk_match_reminder_delivery_slot', ['matchId', 'fanExternalUserId', 'reminderWindow'], { unique: true })
export class MatchReminderDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 191 })
  idempotencyKey: string;

  @Column({ name: 'match_id', type: 'int' })
  matchId: number;

  @Column({ name: 'fan_id', type: 'int' })
  fanId: number;

  @Column({ name: 'fan_external_user_id', type: 'int' })
  fanExternalUserId: number;

  @Column({ name: 'reminder_window', type: 'int' })
  reminderWindow: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: ReminderDeliveryStatus;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount: number;

  @Column({ name: 'last_attempt_at', type: 'datetime', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ name: 'next_attempt_at', type: 'datetime', nullable: true })
  nextAttemptAt: Date | null;

  @Column({ name: 'last_error', type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
