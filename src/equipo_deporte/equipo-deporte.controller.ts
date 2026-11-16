import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AsociarDeporteDto } from './dto/asociar-deporte.dto';
import { EquipoDeporteService } from './equipo-deporte.service';

@Controller('equipos')
export class EquipoDeporteController {
  constructor(private readonly equipoDeporteService: EquipoDeporteService) {}

  @Get(':id/deportes')
  list(@Param('id', ParseIntPipe) id: number) {
    return this.equipoDeporteService.list(id);
  }

  @Post(':id/deportes')
  @HttpCode(201)
  associate(@Param('id', ParseIntPipe) id: number, @Body() dto: AsociarDeporteDto) {
    return this.equipoDeporteService.associate(id, dto.deporteId);
  }

  @Delete(':id/deportes/:deporteId')
  remove(@Param('id', ParseIntPipe) id: number, @Param('deporteId', ParseIntPipe) deporteId: number) {
    return this.equipoDeporteService.remove(id, deporteId);
  }
}
