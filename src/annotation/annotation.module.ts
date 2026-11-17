import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jugador } from '../jugador/entities/jugador.entity';
import { MatchModule } from '../match/match.module';
import { Vinculacion } from '../vinculacion/entities/vinculacion.entity';
import { AnnotationController } from './annotation.controller';
import { AnnotationParticipantService } from './annotation-participant.service';
import { AnnotationService } from './annotation.service';
import { Annotation } from './entities/annotation.entity';
import { AnnotationMapper } from './mappers/annotation.mapper';

@Module({
  imports: [
    MatchModule,
    TypeOrmModule.forFeature([Annotation, Jugador, Vinculacion]),
  ],
  controllers: [AnnotationController],
  providers: [AnnotationService, AnnotationParticipantService, AnnotationMapper],
})
export class AnnotationModule {}
