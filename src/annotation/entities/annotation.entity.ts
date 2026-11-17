import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('anotaciones')
export class Annotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id', type: 'int' })
  matchId: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @Column({ type: 'int', nullable: true })
  minute: number | null;

  @Column({ type: 'varchar', length: 250 })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
