import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { TeamModule } from '../team/team.module';
import { TeamSportController } from './team-sport.controller';
import { TeamSportService } from './team-sport.service';
import { TeamSportMapper } from './mappers/team-sport.mapper';

@Module({
  imports: [CatalogCoreModule, TeamModule],
  controllers: [TeamSportController],
  providers: [TeamSportService, TeamSportMapper],
})
export class TeamSportModule {}
