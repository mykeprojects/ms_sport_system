import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  BadRequestException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentService } from './tournament.service';
import { TOURNAMENT_STATUSES } from './tournament.constants';
import type { TournamentStatus } from './tournament.constants';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: TournamentStatus,
    @Query('sportId') sportId?: string,
  ) {
    const parsedSportId =
      sportId === undefined ? undefined : Number(sportId);
    if (sportId !== undefined && (!Number.isInteger(parsedSportId) || parsedSportId! < 1)) {
      throw new BadRequestException('sportId must be a positive integer.');
    }
    if (status && !TOURNAMENT_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid tournament status.');
    }
    return this.tournamentService.list(q, status, parsedSportId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTournamentDto) {
    return this.tournamentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentService.remove(id);
  }
}
