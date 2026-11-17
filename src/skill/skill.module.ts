import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';
import { SkillMapper } from './mappers/skill.mapper';

@Module({
  imports: [CatalogCoreModule],
  controllers: [SkillController],
  providers: [SkillService, SkillMapper],
})
export class SkillModule {}
