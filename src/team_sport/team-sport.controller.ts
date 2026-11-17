import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AssignSportDto } from './dto/assign-sport.dto';
import { TeamSportService } from './team-sport.service';

@Controller('teams')
export class TeamSportController {
  constructor(private readonly teamSportService: TeamSportService) {}

  @Get(':id/sports')
  list(@Param('id', ParseIntPipe) id: number) {
    return this.teamSportService.list(id);
  }

  @Post(':id/sports')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignSportDto) {
    return this.teamSportService.associate(id, dto.sportId);
  }

  @Delete(':id/sports/:sportId')
  remove(@Param('id', ParseIntPipe) id: number, @Param('sportId', ParseIntPipe) sportId: number) {
    return this.teamSportService.remove(id, sportId);
  }
}
