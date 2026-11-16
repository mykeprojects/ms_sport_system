import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { HabilidadController } from './habilidad.controller';
import { HabilidadService } from './habilidad.service';
import { HabilidadMapper } from './mappers/habilidad.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [HabilidadController],
  providers: [HabilidadService, HabilidadMapper],
})
export class HabilidadModule {}
