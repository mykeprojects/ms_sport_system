import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_id' })
  playerId: number;

  @Column({ name: 'team_id' })
  teamId: number;

  @Column({ name: 'start_date', length: 10 })
  startDate: string;

  @Column({ name: 'end_date', length: 10 })
  endDate: string;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'end_reason', type: 'varchar', length: 80, nullable: true })
  endReason: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  detail: string | null;

  @Column({ name: 'active_player_key', type: 'int', nullable: true, unique: true })
  activePlayerKey: number | null;
}
