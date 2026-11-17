import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SavePlayerDto } from './dto/save-player.dto';
import { PlayerService } from './player.service';

@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('teamId') teamId?: string,
    @Query('sportId') sportId?: string,
  ) {
    return this.playerService.list(q, status, teamId, sportId);
  }

  @Get(':id/profile')
  profile(@Param('id', ParseIntPipe) id: number) {
    return this.playerService.profile(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playerService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: SavePlayerDto) {
    return this.playerService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SavePlayerDto) {
    return this.playerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playerService.remove(id);
  }
}
