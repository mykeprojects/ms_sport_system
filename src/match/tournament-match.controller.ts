import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateMatchDto } from './dto/match.dtos';
import { MatchService } from './match.service';

@Controller('tournaments')
export class TournamentMatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get(':tournamentId/matches')
  list(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Query('phaseId') phaseId?: string,
  ) {
    return this.matchService.list(undefined, tournamentId, this.parsePhaseId(phaseId));
  }

  @Post(':tournamentId/matches')
  @HttpCode(201)
  create(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Body() dto: CreateMatchDto,
  ) {
    return this.matchService.create(dto, { tournamentId });
  }

  @Get(':tournamentId/phases/:phaseId/matches')
  listByPhase(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.matchService.list(undefined, tournamentId, phaseId);
  }

  @Post(':tournamentId/phases/:phaseId/matches')
  @HttpCode(201)
  createInPhase(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: CreateMatchDto,
  ) {
    return this.matchService.create(dto, { tournamentId, phaseId });
  }

  private parsePhaseId(value?: string): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('phaseId must be a positive integer.');
    }
    return parsed;
  }
}
