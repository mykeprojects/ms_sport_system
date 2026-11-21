import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FanModule } from '../fan/fan.module';
import { Match } from '../match/entities/match.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { BetRulesConfig } from './bet-rules.config';
import { Bet } from './entities/bet.entity';
import { BetMapper } from './mappers/bet.mapper';
import { MatchBetController } from './match-bet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet, Match]),
    FanModule,
    NotificationsModule,
  ],
  controllers: [BetController, MatchBetController],
  providers: [BetService, BetMapper, BetRulesConfig],
  exports: [BetService],
})
export class BetModule {}
