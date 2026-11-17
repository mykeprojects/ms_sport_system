import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../player/entities/player.entity';
import { MatchModule } from '../match/match.module';
import { Contract } from '../contract/entities/contract.entity';
import { AnnotationController } from './annotation.controller';
import { AnnotationParticipantService } from './annotation-participant.service';
import { AnnotationService } from './annotation.service';
import { Annotation } from './entities/annotation.entity';
import { AnnotationMapper } from './mappers/annotation.mapper';

@Module({
  imports: [
    MatchModule,
    TypeOrmModule.forFeature([Annotation, Player, Contract]),
  ],
  controllers: [AnnotationController],
  providers: [AnnotationService, AnnotationParticipantService, AnnotationMapper],
})
export class AnnotationModule {}
