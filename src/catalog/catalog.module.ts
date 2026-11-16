import { Module } from '@nestjs/common';
import { CatalogSeedService } from './catalog.seed';
import { CatalogStore } from './catalog.store';

@Module({
  providers: [CatalogStore, CatalogSeedService],
  exports: [CatalogStore],
})
export class CatalogCoreModule {}
