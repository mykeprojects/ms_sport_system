import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from '../sport/entities/sport.entity';
import { Team } from '../team/entities/team.entity';
import { TeamSport } from '../team_sport/entities/team-sport.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { TournamentRegistrationController } from './tournament-registration.controller';
import { TournamentRegistrationService } from './tournament-registration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentRegistration,
      Tournament,
      Team,
      TeamSport,
      Sport,
    ]),
  ],
  controllers: [TournamentRegistrationController],
  providers: [TournamentRegistrationService],
  exports: [TournamentRegistrationService],
})
export class TournamentRegistrationModule {}
