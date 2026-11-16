import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { DeporteController } from './deporte.controller';
import { DeporteService } from './deporte.service';
import { DeporteMapper } from './mappers/deporte.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [DeporteController],
  providers: [DeporteService, DeporteMapper],
})
export class DeporteModule {}
