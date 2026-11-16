import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { EquipoModule } from '../equipo/equipo.module';
import { EquipoDeporteController } from './equipo-deporte.controller';
import { EquipoDeporteService } from './equipo-deporte.service';
import { EquipoDeporteMapper } from './mappers/equipo-deporte.mapper';

@Module({
  imports: [CatalogCoreModule, EquipoModule],
  controllers: [EquipoDeporteController],
  providers: [EquipoDeporteService, EquipoDeporteMapper],
})
export class EquipoDeporteModule {}
