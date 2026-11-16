import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { VinculacionMapper } from './mappers/vinculacion.mapper';
import { PlantillaController, VinculacionController } from './vinculacion.controller';
import { VinculacionService } from './vinculacion.service';

@Module({
  imports: [CatalogCoreModule],
  controllers: [PlantillaController, VinculacionController],
  providers: [VinculacionService, VinculacionMapper],
})
export class VinculacionModule {}
