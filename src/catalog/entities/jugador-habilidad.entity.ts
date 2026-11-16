import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('jugador_habilidades')
@Unique('uk_jugador_habilidad', ['jugadorId', 'habilidadId'])
export class JugadorHabilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'jugador_id' })
  jugadorId: number;

  @Column({ name: 'habilidad_id' })
  habilidadId: number;

  @Column({ type: 'int' })
  score: number;
}
