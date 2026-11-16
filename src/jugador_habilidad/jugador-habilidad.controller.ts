import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AsignarHabilidadDto } from './dto/asignar-habilidad.dto';
import { JugadorHabilidadService } from './jugador-habilidad.service';

@Controller('jugadores')
export class JugadorHabilidadController {
  constructor(private readonly jugadorHabilidadService: JugadorHabilidadService) {}

  @Post(':id/habilidades')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarHabilidadDto) {
    return this.jugadorHabilidadService.assign(id, dto.habilidadId);
  }

  @Delete(':id/habilidades/:habilidadId')
  remove(@Param('id', ParseIntPipe) id: number, @Param('habilidadId', ParseIntPipe) habilidadId: number) {
    return this.jugadorHabilidadService.remove(id, habilidadId);
  }
}
