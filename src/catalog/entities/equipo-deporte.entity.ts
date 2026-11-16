import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('equipo_deportes')
@Unique('uk_equipo_deporte', ['equipoId', 'deporteId'])
export class EquipoDeporte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'equipo_id' })
  equipoId: number;

  @Column({ name: 'deporte_id' })
  deporteId: number;
}
