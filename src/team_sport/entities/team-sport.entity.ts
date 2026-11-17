import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('team_sports')
@Unique('uk_team_sport', ['teamId', 'sportId'])
export class TeamSport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id' })
  teamId: number;

  @Column({ name: 'sport_id' })
  sportId: number;
}
