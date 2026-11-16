import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ActualizarVinculacionDto } from './dto/actualizar-vinculacion.dto';
import { AsignarVinculacionDto } from './dto/asignar-vinculacion.dto';
import { RetirarVinculacionDto } from './dto/retirar-vinculacion.dto';
import { VinculacionService } from './vinculacion.service';

@Controller('equipos')
export class PlantillaController {
  constructor(private readonly vinculacionService: VinculacionService) {}

  @Get(':id/plantilla')
  plantilla(@Param('id', ParseIntPipe) id: number) {
    return this.vinculacionService.plantilla(id);
  }

  @Post(':id/jugadores')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarVinculacionDto) {
    return this.vinculacionService.assign(id, dto.jugadorId, dto.startDate, dto.endDate);
  }
}

@Controller('vinculaciones')
export class VinculacionController {
  constructor(private readonly vinculacionService: VinculacionService) {}

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarVinculacionDto) {
    return this.vinculacionService.update(id, dto.startDate, dto.endDate);
  }

  @Post(':id/retirar')
  release(@Param('id', ParseIntPipe) id: number, @Body() dto: RetirarVinculacionDto) {
    return this.vinculacionService.release(id, dto.reason, dto.detail);
  }
}
