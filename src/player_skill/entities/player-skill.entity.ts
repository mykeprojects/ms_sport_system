import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('player_skills')
@Unique('uk_player_skill', ['playerId', 'skillId'])
export class PlayerSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_id' })
  playerId: number;

  @Column({ name: 'skill_id' })
  skillId: number;

  @Column({ type: 'int' })
  score: number;
}
