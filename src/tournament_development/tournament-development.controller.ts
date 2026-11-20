import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TournamentDevelopmentService } from './tournament-development.service';

@Controller('tournaments')
export class TournamentDevelopmentController {
  constructor(private readonly service: TournamentDevelopmentService) {}

  @Get(':tournamentId/development')
  getDevelopment(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.service.getDevelopment(tournamentId);
  }
}
