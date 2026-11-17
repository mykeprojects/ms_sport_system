import { Injectable } from '@nestjs/common';
import type { CreateAnnotationDto } from '../dto/create-annotation.dto';
import type { UpdateAnnotationDto } from '../dto/update-annotation.dto';
import { Annotation } from '../entities/annotation.entity';
import type { AnnotationResponseDto } from '../dto/annotation-response.dto';

@Injectable()
export class AnnotationMapper {
  toCreateEntity(matchId: number, teamId: number, dto: CreateAnnotationDto): Annotation {
    const annotation = new Annotation();
    annotation.matchId = matchId;
    annotation.playerId = dto.playerId;
    annotation.teamId = teamId;
    annotation.minute = dto.minute ?? null;
    annotation.description = dto.description.trim();
    return annotation;
  }

  applyUpdate(annotation: Annotation, dto: UpdateAnnotationDto, teamId: number): Annotation {
    if (dto.playerId !== undefined) annotation.playerId = dto.playerId;
    if (dto.minute !== undefined) annotation.minute = dto.minute;
    if (dto.description !== undefined) annotation.description = dto.description.trim();
    annotation.teamId = teamId;
    return annotation;
  }

  toResponse(annotation: Annotation): AnnotationResponseDto {
    return {
      id: annotation.id,
      matchId: annotation.matchId,
      playerId: annotation.playerId,
      teamId: annotation.teamId,
      minute: annotation.minute,
      description: annotation.description,
      createdAt: annotation.createdAt,
      updatedAt: annotation.updatedAt,
    };
  }

  toResponseList(annotations: Annotation[]): AnnotationResponseDto[] {
    return annotations.map((annotation) => this.toResponse(annotation));
  }
}
