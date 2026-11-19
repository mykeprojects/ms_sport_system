import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from '../sport/entities/sport.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentController } from './tournament.controller';
import { TournamentMapper } from './tournament.mapper';
import { TournamentService } from './tournament.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Sport])],
  controllers: [TournamentController],
  providers: [TournamentService, TournamentMapper],
  exports: [TournamentService],
})
export class TournamentModule {}
