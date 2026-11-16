import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveJugadorDto } from './dto/save-jugador.dto';
import { JugadorService } from './jugador.service';

@Controller('jugadores')
export class JugadorController {
  constructor(private readonly jugadorService: JugadorService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('equipoId') equipoId?: string,
    @Query('deporteId') deporteId?: string,
  ) {
    return this.jugadorService.list(q, status, equipoId, deporteId);
  }

  @Get(':id/perfil')
  perfil(@Param('id', ParseIntPipe) id: number) {
    return this.jugadorService.perfil(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jugadorService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveJugadorDto) {
    return this.jugadorService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveJugadorDto) {
    return this.jugadorService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jugadorService.remove(id);
  }
}
