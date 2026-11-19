import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { TournamentStatus } from '../tournament.constants';

@Entity('tournaments')
@Index('uk_tournament_name_sport', ['nameKey', 'sportId'], { unique: true })
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120 })
  nameKey: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Column({ name: 'sport_id', type: 'int' })
  sportId: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status: TournamentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
