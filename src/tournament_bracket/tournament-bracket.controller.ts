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
import { SaveTournamentBracketDto } from './dto/save-tournament-bracket.dto';
import { SetBracketWinnerDto } from './dto/set-bracket-winner.dto';
import { TournamentBracketService } from './tournament-bracket.service';

@Controller('tournaments/:tournamentId/phases/:phaseId/brackets')
export class TournamentBracketController {
  constructor(private readonly service: TournamentBracketService) {}

  @Get()
  list(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.service.list(tournamentId, phaseId);
  }

  @Post('generate')
  @HttpCode(201)
  generate(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.service.generate(tournamentId, phaseId);
  }

  @Post()
  @HttpCode(201)
  save(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: SaveTournamentBracketDto,
  ) {
    return this.service.save(tournamentId, phaseId, dto);
  }

  @Patch(':bracketId/winner')
  setWinner(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('bracketId', ParseIntPipe) bracketId: number,
    @Body() dto: SetBracketWinnerDto,
  ) {
    return this.service.setWinner(tournamentId, phaseId, bracketId, dto.winnerTeamId);
  }

  @Delete(':bracketId')
  remove(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('bracketId', ParseIntPipe) bracketId: number,
  ) {
    return this.service.remove(tournamentId, phaseId, bracketId);
  }
}
