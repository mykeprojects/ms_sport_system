import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../match/entities/match.entity';
import { Team } from '../team/entities/team.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentBracket } from '../tournament_bracket/entities/tournament-bracket.entity';
import { TournamentGroup } from '../tournament_group/entities/tournament-group.entity';
import { TournamentGroupTeam } from '../tournament_group/entities/tournament-group-team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentDevelopmentController } from './tournament-development.controller';
import { TournamentDevelopmentService } from './tournament-development.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      TournamentPhase,
      TournamentGroup,
      TournamentGroupTeam,
      TournamentBracket,
      Match,
      Team,
    ]),
  ],
  controllers: [TournamentDevelopmentController],
  providers: [TournamentDevelopmentService],
})
export class TournamentDevelopmentModule {}
