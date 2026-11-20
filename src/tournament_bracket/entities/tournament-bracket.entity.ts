import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TournamentBracketRound = 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL';
export type TournamentBracketStatus = 'PENDING' | 'FINISHED' | 'CANCELLED';

@Entity('tournament_brackets')
@Index('uk_tournament_bracket_slot', ['phaseId', 'roundType', 'bracketOrder'], { unique: true })
export class TournamentBracket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phase_id', type: 'int' })
  phaseId: number;

  @Column({ name: 'round_type', type: 'varchar', length: 20 })
  roundType: TournamentBracketRound;

  @Column({ name: 'bracket_order', type: 'int' })
  bracketOrder: number;

  @Column({ name: 'team_a_id', type: 'int', nullable: true })
  teamAId: number | null;

  @Column({ name: 'team_b_id', type: 'int', nullable: true })
  teamBId: number | null;

  @Column({ name: 'winner_team_id', type: 'int', nullable: true })
  winnerTeamId: number | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: TournamentBracketStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
