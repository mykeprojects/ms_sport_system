import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DeportesController,
  EquiposController,
  HabilidadesController,
  JugadoresController,
  VinculacionesController,
} from './catalog.controller';
import { CatalogSeedService } from './catalog.seed';
import { CatalogService } from './catalog.service';
import { CatalogStore } from './catalog.store';
import { Deporte } from './entities/deporte.entity';
import { Equipo } from './entities/equipo.entity';
import { EquipoDeporte } from './entities/equipo-deporte.entity';
import { Habilidad } from './entities/habilidad.entity';
import { Jugador } from './entities/jugador.entity';
import { JugadorHabilidad } from './entities/jugador-habilidad.entity';
import { Vinculacion } from './entities/vinculacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deporte,
      Equipo,
      EquipoDeporte,
      Jugador,
      Vinculacion,
      Habilidad,
      JugadorHabilidad,
    ]),
  ],
  controllers: [
    DeportesController,
    EquiposController,
    VinculacionesController,
    JugadoresController,
    HabilidadesController,
  ],
  providers: [CatalogService, CatalogStore, CatalogSeedService],
})
export class CatalogModule {}
