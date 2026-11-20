import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TournamentRegistrationStatus = 'REGISTERED' | 'WITHDRAWN';

@Entity('tournament_registrations')
@Index('uk_tournament_team', ['tournamentId', 'teamId'], { unique: true })
export class TournamentRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tournament_id', type: 'int' })
  tournamentId: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @Column({ type: 'varchar', length: 20, default: 'REGISTERED' })
  status: TournamentRegistrationStatus;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamp' })
  registeredAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
