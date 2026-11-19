import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../team/entities/team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { TournamentGroupTeam } from './entities/tournament-group-team.entity';
import { TournamentGroup } from './entities/tournament-group.entity';
import { TournamentGroupController } from './tournament-group.controller';
import { TournamentGroupService } from './tournament-group.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentGroup,
      TournamentGroupTeam,
      TournamentPhase,
      TournamentRegistration,
      Team,
    ]),
  ],
  controllers: [TournamentGroupController],
  providers: [TournamentGroupService],
  exports: [TournamentGroupService],
})
export class TournamentGroupModule {}
