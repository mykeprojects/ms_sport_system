import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SaveDeporteDto } from './dto/save-deporte.dto';
import { DeporteService } from './deporte.service';

@Controller('deportes')
export class DeporteController {
  constructor(private readonly deporteService: DeporteService) {}

  @Get()
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('soloPadres') soloPadres?: string) {
    return this.deporteService.list(q, status, soloPadres);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deporteService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SaveDeporteDto) {
    return this.deporteService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveDeporteDto) {
    return this.deporteService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deporteService.remove(id);
  }
}
