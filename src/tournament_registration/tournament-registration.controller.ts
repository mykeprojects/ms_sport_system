import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { RegisterTeamDto } from './dto/register-team.dto';
import { TournamentRegistrationService } from './tournament-registration.service';

@Controller('tournaments')
export class TournamentRegistrationController {
  constructor(private readonly service: TournamentRegistrationService) {}

  @Get(':id/registrations')
  list(@Param('id', ParseIntPipe) tournamentId: number) {
    return this.service.list(tournamentId);
  }

  @Post(':id/registrations')
  @HttpCode(201)
  register(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Body() dto: RegisterTeamDto,
  ) {
    return this.service.register(tournamentId, dto.teamId);
  }

  @Delete(':id/registrations/:teamId')
  withdraw(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.service.withdraw(tournamentId, teamId);
  }
}
