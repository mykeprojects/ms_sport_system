import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { JugadorController } from './jugador.controller';
import { JugadorService } from './jugador.service';
import { JugadorMapper } from './mappers/jugador.mapper';
import { PerfilMapper } from './mappers/perfil.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [JugadorController],
  providers: [JugadorService, JugadorMapper, PerfilMapper],
})
export class JugadorModule {}
