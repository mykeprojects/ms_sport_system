import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveSkillDto } from './dto/save-skill.dto';
import { SkillService } from './skill.service';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  list(@Query('q') q?: string, @Query('category') category?: string) {
    return this.skillService.list(q, category);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveSkillDto) {
    return this.skillService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveSkillDto) {
    return this.skillService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.remove(id);
  }
}
