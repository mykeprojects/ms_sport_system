import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../team/entities/team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { TournamentBracket } from './entities/tournament-bracket.entity';
import { TournamentBracketController } from './tournament-bracket.controller';
import { TournamentBracketService } from './tournament-bracket.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentBracket,
      TournamentPhase,
      TournamentRegistration,
      Team,
    ]),
  ],
  controllers: [TournamentBracketController],
  providers: [TournamentBracketService],
  exports: [TournamentBracketService],
})
export class TournamentBracketModule {}
