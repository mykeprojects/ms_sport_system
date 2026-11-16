import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveHabilidadDto } from './dto/save-habilidad.dto';
import { HabilidadService } from './habilidad.service';

@Controller('habilidades')
export class HabilidadController {
  constructor(private readonly habilidadService: HabilidadService) {}

  @Get()
  list(@Query('q') q?: string, @Query('category') category?: string) {
    return this.habilidadService.list(q, category);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.habilidadService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveHabilidadDto) {
    return this.habilidadService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveHabilidadDto) {
    return this.habilidadService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.habilidadService.remove(id);
  }
}
