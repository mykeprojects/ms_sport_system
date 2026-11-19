import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fan_followed_teams')
@Index('uk_fan_followed_team', ['fanId', 'teamId'], { unique: true })
export class FanFollowedTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fan_id', type: 'int' })
  fanId: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
