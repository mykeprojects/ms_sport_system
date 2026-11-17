import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveSportDto } from './dto/save-sport.dto';
import { SportService } from './sport.service';

@Controller('sports')
export class SportController {
  constructor(private readonly sportService: SportService) {}

  @Get()
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('soloPadres') soloPadres?: string) {
    return this.sportService.list(q, status, soloPadres);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sportService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveSportDto) {
    return this.sportService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveSportDto) {
    return this.sportService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sportService.remove(id);
  }
}
