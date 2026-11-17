import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { PlayerSkillController } from './player-skill.controller';
import { PlayerSkillService } from './player-skill.service';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [PlayerSkillController],
  providers: [PlayerSkillService, PlayerSkillMapper],
})
export class PlayerSkillModule {}
