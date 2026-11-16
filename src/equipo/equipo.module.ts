import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';
import { EquipoMapper } from './mappers/equipo.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [EquipoController],
  providers: [EquipoService, EquipoMapper],
  exports: [EquipoService],
})
export class EquipoModule {}
