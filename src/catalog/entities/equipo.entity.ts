import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120, unique: true })
  nameKey: string;

  @Column({ name: 'short_name', length: 40 })
  shortName: string;

  @Column({ length: 80 })
  city: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'created_at', length: 10 })
  createdAt: string;

  @Column({ length: 20, default: '#3dff7a' })
  color: string;
}
