import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('fans')
export class Fan {
  @PrimaryGeneratedColumn()
  id: number;

  /** User id coming from the ms_security JWT (`sub` claim). */
  @Column({ name: 'external_user_id', type: 'int', unique: true })
  externalUserId: number;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 160, nullable: true })
  fullName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
