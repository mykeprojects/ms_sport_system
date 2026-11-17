import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { SportController } from './sport.controller';
import { SportService } from './sport.service';
import { SportMapper } from './mappers/sport.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [SportController],
  providers: [SportService, SportMapper],
})
export class SportModule {}
