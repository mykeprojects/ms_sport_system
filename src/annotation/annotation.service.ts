import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchService } from '../match/match.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { Annotation } from './entities/annotation.entity';
import { AnnotationMapper } from './mappers/annotation.mapper';
import { AnnotationParticipantService } from './annotation-participant.service';

@Injectable()
export class AnnotationService {
  constructor(
    @InjectRepository(Annotation)
    private readonly annotationRepository: Repository<Annotation>,
    private readonly matchService: MatchService,
    private readonly participantService: AnnotationParticipantService,
    private readonly mapper: AnnotationMapper,
  ) {}

  async listByMatch(matchId: number) {
    await this.matchService.getEntity(matchId);
    const annotations = await this.annotationRepository.find({
      where: { matchId },
      order: { minute: 'ASC', id: 'ASC' },
    });
    return this.mapper.toResponseList(annotations);
  }

  async create(matchId: number, dto: CreateAnnotationDto) {
    const match = await this.matchService.getEntity(matchId);
    this.assertMatchCanReceiveAnnotations(match.status);
    const teamId = await this.participantService.resolveTeamId(match, dto.playerId);
    const saved = await this.annotationRepository.save(
      this.mapper.toCreateEntity(matchId, teamId, dto),
    );
    return this.mapper.toResponse(saved);
  }

  async update(matchId: number, annotationId: number, dto: UpdateAnnotationDto) {
    const match = await this.matchService.getEntity(matchId);
    this.assertMatchCanReceiveAnnotations(match.status);
    const annotation = await this.annotationRepository.findOne({
      where: { id: annotationId, matchId },
    });
    if (!annotation) throw new NotFoundException(`Annotation #${annotationId} was not found.`);

    const playerId = dto.playerId ?? annotation.playerId;
    const teamId = await this.participantService.resolveTeamId(match, playerId);
    const saved = await this.annotationRepository.save(
      this.mapper.applyUpdate(annotation, dto, teamId),
    );
    return this.mapper.toResponse(saved);
  }

  async remove(matchId: number, annotationId: number) {
    const match = await this.matchService.getEntity(matchId);
    if (match.status === 'FINISHED') {
      throw new ConflictException('Annotations cannot be deleted after the match is finished.');
    }
    if (match.status !== 'IN_PROGRESS') {
      throw new ConflictException('Annotations can only be deleted while the match is in progress.');
    }
    const annotation = await this.annotationRepository.findOne({
      where: { id: annotationId, matchId },
    });
    if (!annotation) throw new NotFoundException(`Annotation #${annotationId} was not found.`);
    await this.annotationRepository.remove(annotation);
    return { message: `Annotation #${annotationId} removed successfully.` };
  }

  private assertMatchCanReceiveAnnotations(status: string): void {
    if (status !== 'IN_PROGRESS') {
      throw new ConflictException('Annotations can only be registered while the match is in progress.');
    }
  }
}
