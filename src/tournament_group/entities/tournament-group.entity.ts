import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tournament_groups')
@Index('uk_tournament_phase_group_name', ['phaseId', 'nameKey'], { unique: true })
export class TournamentGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phase_id', type: 'int' })
  phaseId: number;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120 })
  nameKey: string;

  @Column({ name: 'group_order', type: 'int', default: 1 })
  groupOrder: number;

  @Column({ name: 'max_teams', type: 'int', nullable: true })
  maxTeams: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
