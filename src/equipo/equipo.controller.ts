import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveEquipoDto } from './dto/save-equipo.dto';
import { EquipoService } from './equipo.service';

@Controller('equipos')
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Get()
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('deporteId') deporteId?: string) {
    return this.equipoService.list(q, status, deporteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipoService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveEquipoDto) {
    return this.equipoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveEquipoDto) {
    return this.equipoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipoService.remove(id);
  }
}
