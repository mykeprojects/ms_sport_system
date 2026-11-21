import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FanModule } from '../fan/fan.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Team } from '../team/entities/team.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentBracket } from '../tournament_bracket/entities/tournament-bracket.entity';
import { TournamentGroup } from '../tournament_group/entities/tournament-group.entity';
import { TournamentGroupTeam } from '../tournament_group/entities/tournament-group-team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { Match } from './entities/match.entity';
import { MatchReminderDelivery } from './entities/match-reminder-delivery.entity';
import { MatchController } from './match.controller';
import { MatchNotificationService } from './match-notification.service';
import { MatchReminderScheduler } from './match-reminder.scheduler';
import { MatchService } from './match.service';
import { MatchMapper } from './mappers/match.mapper';
import { TournamentMatchController } from './tournament-match.controller';
import { Annotation } from '../annotation/entities/annotation.entity';
import { MatchTrackingSession } from './tracking/entities/match-tracking.entity';
import { BetModule } from '../bet/bet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Match,
      MatchReminderDelivery,
      Annotation,
      MatchTrackingSession,
      Tournament,
      TournamentPhase,
      TournamentRegistration,
      TournamentBracket,
      TournamentGroup,
      TournamentGroupTeam,
      Team,
    ]),
    NotificationsModule,
    FanModule,
    BetModule,
  ],
  controllers: [MatchController, TournamentMatchController],
  providers: [MatchService, MatchNotificationService, MatchReminderScheduler, MatchMapper],
  exports: [MatchService, MatchNotificationService],
})
export class MatchModule {}
