import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTournamentPhaseDto } from './dto/create-tournament-phase.dto';
import { UpdateTournamentPhaseDto } from './dto/update-tournament-phase.dto';
import { TournamentPhaseService } from './tournament-phase.service';

@Controller('tournaments/:tournamentId/phases')
export class TournamentPhaseController {
  constructor(private readonly phaseService: TournamentPhaseService) {}

  @Get()
  list(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.phaseService.list(tournamentId);
  }

  @Get(':phaseId')
  findOne(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.phaseService.findOne(tournamentId, phaseId);
  }

  @Post()
  @HttpCode(201)
  create(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Body() dto: CreateTournamentPhaseDto,
  ) {
    return this.phaseService.create(tournamentId, dto);
  }

  @Patch(':phaseId')
  update(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: UpdateTournamentPhaseDto,
  ) {
    return this.phaseService.update(tournamentId, phaseId, dto);
  }

  @Delete(':phaseId')
  remove(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.phaseService.remove(tournamentId, phaseId);
  }
}
