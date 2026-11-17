import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { PlayerMapper } from './mappers/player.mapper';
import { ProfileMapper } from './mappers/profile.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [PlayerController],
  providers: [PlayerService, PlayerMapper, ProfileMapper],
})
export class PlayerModule {}
