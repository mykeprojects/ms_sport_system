import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sports')
export class Sport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120, unique: true })
  nameKey: string;

  @Column({ length: 80 })
  category: string;

  @Column({ length: 250, default: '' })
  description: string;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @Column({ name: 'created_at', length: 10 })
  createdAt: string;
}
