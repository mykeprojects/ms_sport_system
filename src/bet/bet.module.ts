import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FanModule } from '../fan/fan.module';
import { MatchModule } from '../match/match.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { BetRulesConfig } from './bet-rules.config';
import { Bet } from './entities/bet.entity';
import { BetMapper } from './mappers/bet.mapper';
import { MatchBetController } from './match-bet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bet]), FanModule, MatchModule, NotificationsModule],
  controllers: [BetController, MatchBetController],
  providers: [BetService, BetMapper, BetRulesConfig],
})
export class BetModule {}
