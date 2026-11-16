import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  ActualizarVinculacionDto,
  AsignarHabilidadDto,
  AsignarVinculacionDto,
  AsociarDeporteDto,
  RetirarVinculacionDto,
  SaveDeporteDto,
  SaveEquipoDto,
  SaveHabilidadDto,
  SaveJugadorDto,
} from './catalog.dto';

@Controller('deportes')
export class DeportesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('soloPadres') soloPadres?: string) {
    return this.catalog.listDeportes(q, status, soloPadres);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getDeporte(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveDeporteDto) {
    return this.catalog.createDeporte(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveDeporteDto) {
    return this.catalog.updateDeporte(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeDeporte(id);
  }
}

@Controller('equipos')
export class EquiposController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('deporteId') deporteId?: string) {
    return this.catalog.listEquipos(q, status, deporteId);
  }

  @Get(':id/deportes')
  sports(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.listAsociaciones(id);
  }

  @Post(':id/deportes')
  @HttpCode(201)
  associate(@Param('id', ParseIntPipe) id: number, @Body() dto: AsociarDeporteDto) {
    return this.catalog.associate(id, dto.deporteId);
  }

  @Delete(':id/deportes/:deporteId')
  removeSport(
    @Param('id', ParseIntPipe) id: number,
    @Param('deporteId', ParseIntPipe) deporteId: number,
  ) {
    return this.catalog.removeAssociation(id, deporteId);
  }

  @Get(':id/plantilla')
  roster(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.plantilla(id);
  }

  @Post(':id/jugadores')
  @HttpCode(201)
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarVinculacionDto) {
    return this.catalog.assignToTeam(id, dto.jugadorId, dto.startDate, dto.endDate);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getEquipo(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveEquipoDto) {
    return this.catalog.createEquipo(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveEquipoDto) {
    return this.catalog.updateEquipo(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeEquipo(id);
  }
}

@Controller('vinculaciones')
export class VinculacionesController {
  constructor(private readonly catalog: CatalogService) {}

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarVinculacionDto) {
    return this.catalog.updateVinculacion(id, dto.startDate, dto.endDate);
  }

  @Post(':id/retirar')
  release(@Param('id', ParseIntPipe) id: number, @Body() dto: RetirarVinculacionDto) {
    return this.catalog.release(id, dto.reason, dto.detail);
  }
}

@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('equipoId') equipoId?: string,
    @Query('deporteId') deporteId?: string,
  ) {
    return this.catalog.listJugadores(q, status, equipoId, deporteId);
  }

  @Get(':id/perfil')
  profile(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.perfil(id);
  }

  @Post(':id/habilidades')
  @HttpCode(201)
  assignSkill(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarHabilidadDto) {
    return this.catalog.assignHabilidad(id, dto.habilidadId);
  }

  @Delete(':id/habilidades/:habilidadId')
  removeSkill(
    @Param('id', ParseIntPipe) id: number,
    @Param('habilidadId', ParseIntPipe) habilidadId: number,
  ) {
    return this.catalog.removeHabilidadJugador(id, habilidadId);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getJugador(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveJugadorDto) {
    return this.catalog.createJugador(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveJugadorDto) {
    return this.catalog.updateJugador(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeJugador(id);
  }
}

@Controller('habilidades')
export class HabilidadesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query('q') q?: string, @Query('category') category?: string) {
    return this.catalog.listHabilidades(q, category);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getHabilidad(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveHabilidadDto) {
    return this.catalog.createHabilidad(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveHabilidadDto) {
    return this.catalog.updateHabilidad(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeHabilidad(id);
  }
}
