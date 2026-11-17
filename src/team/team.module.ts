import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamMapper } from './mappers/team.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [TeamController],
  providers: [TeamService, TeamMapper],
  exports: [TeamService],
})
export class TeamModule {}
