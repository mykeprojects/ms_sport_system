import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentPhase } from './entities/tournament-phase.entity';
import { TournamentPhaseController } from './tournament-phase.controller';
import { TournamentPhaseService } from './tournament-phase.service';

@Module({
  imports: [TypeOrmModule.forFeature([TournamentPhase, Tournament])],
  controllers: [TournamentPhaseController],
  providers: [TournamentPhaseService],
  exports: [TournamentPhaseService],
})
export class TournamentPhaseModule {}
