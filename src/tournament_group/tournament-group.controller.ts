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
import { AssignTournamentGroupTeamDto } from './dto/assign-tournament-group-team.dto';
import { SaveTournamentGroupDto } from './dto/save-tournament-group.dto';
import { TournamentGroupService } from './tournament-group.service';

@Controller('tournaments/:tournamentId/phases/:phaseId/groups')
export class TournamentGroupController {
  constructor(private readonly service: TournamentGroupService) {}

  @Get()
  list(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.service.list(tournamentId, phaseId);
  }

  @Post()
  @HttpCode(201)
  create(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: SaveTournamentGroupDto,
  ) {
    return this.service.create(tournamentId, phaseId, dto);
  }

  @Patch(':groupId')
  update(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: SaveTournamentGroupDto,
  ) {
    return this.service.update(tournamentId, phaseId, groupId, dto);
  }

  @Delete(':groupId')
  remove(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.service.remove(tournamentId, phaseId, groupId);
  }

  @Post(':groupId/teams')
  @HttpCode(201)
  assignTeam(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignTournamentGroupTeamDto,
  ) {
    return this.service.assignTeam(tournamentId, phaseId, groupId, dto.teamId);
  }

  @Delete(':groupId/teams/:teamId')
  removeTeam(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.service.removeTeam(tournamentId, phaseId, groupId, teamId);
  }
}
