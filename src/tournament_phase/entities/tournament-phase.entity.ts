import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TournamentPhaseType = 'GROUPS' | 'KNOCKOUT';
export type TournamentPhaseStatus = 'PLANNED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

@Entity('tournament_phases')
@Index('uk_tournament_phase_order', ['tournamentId', 'phaseOrder'], { unique: true })
@Index('uk_tournament_phase_name', ['tournamentId', 'nameKey'], { unique: true })
export class TournamentPhase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tournament_id', type: 'int' })
  tournamentId: number;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120 })
  nameKey: string;

  @Column({ name: 'phase_order', type: 'int' })
  phaseOrder: number;

  @Column({ name: 'phase_type', type: 'varchar', length: 20 })
  phaseType: TournamentPhaseType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 20, default: 'PLANNED' })
  status: TournamentPhaseStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
