import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { JugadorHabilidadController } from './jugador-habilidad.controller';
import { JugadorHabilidadService } from './jugador-habilidad.service';
import { JugadorHabilidadMapper } from './mappers/jugador-habilidad.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [JugadorHabilidadController],
  providers: [JugadorHabilidadService, JugadorHabilidadMapper],
})
export class JugadorHabilidadModule {}
