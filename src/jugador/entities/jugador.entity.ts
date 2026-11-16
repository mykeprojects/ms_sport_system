import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const decimal = {
  to: (value: number) => value,
  from: (value: string | number | null) => (value == null ? 0 : Number(value)),
};

@Entity('jugadores')
export class Jugador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 160 })
  fullName: string;

  @Column({ length: 40 })
  document: string;

  @Column({ name: 'document_key', length: 40, unique: true })
  documentKey: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ length: 80 })
  nationality: string;

  @Column({ length: 20 })
  position: string;

  @Column({ name: 'height_m', type: 'decimal', precision: 4, scale: 2, transformer: decimal })
  heightM: number;

  @Column({ name: 'dominant_foot', length: 20 })
  dominantFoot: string;

  @Column({ length: 20 })
  status: string;

  @Column({ length: 160, default: '' })
  email: string;

  @Column({ length: 40, default: '' })
  phone: string;

  @Column({ name: 'preferred_sport_id', type: 'int', nullable: true })
  preferredSportId: number | null;

  @Column({ type: 'int', default: 0 })
  matches: number;

  @Column({ type: 'int', default: 0 })
  goals: number;

  @Column({ type: 'int', default: 0 })
  assists: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0, transformer: decimal })
  rating: number;
}
