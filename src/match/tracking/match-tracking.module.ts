import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogCoreModule } from '../../catalog/catalog.module';
import { Match } from '../entities/match.entity';
import { MatchModule } from '../match.module';
import {
  MatchTrackingBall,
  MatchTrackingPlayer,
  MatchTrackingPosition,
  MatchTrackingSession,
} from './entities/match-tracking.entity';
import { MatchTrackingGateway } from './match-tracking.gateway';
import { MatchTrackingController } from './match-tracking.controller';
import { MatchTrackingService } from './match-tracking.service';
import {
  MatchTrackingPositionStore,
  MatchTrackingPublisher,
  MatchTrackingSimulator,
} from './match-tracking.ports';
import { RandomMatchTrackingSimulator } from './random-match-tracking.simulator';
import { TypeOrmMatchTrackingStore } from './typeorm-match-tracking.store';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Match,
      MatchTrackingSession,
      MatchTrackingPlayer,
      MatchTrackingBall,
      MatchTrackingPosition,
    ]),
    CatalogCoreModule,
    MatchModule,
  ],
  controllers: [MatchTrackingController],
  providers: [
    MatchTrackingGateway,
    MatchTrackingService,
    RandomMatchTrackingSimulator,
    TypeOrmMatchTrackingStore,
    { provide: MatchTrackingPositionStore, useExisting: TypeOrmMatchTrackingStore },
    { provide: MatchTrackingSimulator, useExisting: RandomMatchTrackingSimulator },
    { provide: MatchTrackingPublisher, useExisting: MatchTrackingGateway },
  ],
  exports: [MatchTrackingService],
})
export class MatchTrackingModule {}
