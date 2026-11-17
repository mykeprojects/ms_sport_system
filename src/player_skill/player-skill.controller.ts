import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { PlayerSkillService } from './player-skill.service';

@Controller('players')
export class PlayerSkillController {
  constructor(private readonly playerSkillService: PlayerSkillService) {}

  @Post(':id/skills')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignSkillDto) {
    return this.playerSkillService.assign(id, dto.skillId);
  }

  @Delete(':id/skills/:skillId')
  remove(@Param('id', ParseIntPipe) id: number, @Param('skillId', ParseIntPipe) skillId: number) {
    return this.playerSkillService.remove(id, skillId);
  }
}
