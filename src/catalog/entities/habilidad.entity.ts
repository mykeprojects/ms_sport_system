import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('habilidades')
export class Habilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'name_key', length: 120, unique: true })
  nameKey: string;

  @Column({ length: 20 })
  category: string;

  @Column({ length: 250 })
  description: string;

  @Column({ length: 20, default: 'target' })
  glyph: string;
}
