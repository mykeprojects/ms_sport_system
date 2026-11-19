import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tournament_group_teams')
@Index('uk_tournament_group_team', ['groupId', 'teamId'], { unique: true })
export class TournamentGroupTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'group_id', type: 'int' })
  groupId: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;
}
