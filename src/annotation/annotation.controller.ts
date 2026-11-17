import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';

@Controller('matches/:matchId/annotations')
export class AnnotationController {
  constructor(private readonly annotationService: AnnotationService) {}

  @Get()
  list(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.annotationService.listByMatch(matchId);
  }

  @Post()
  @HttpCode(201)
  create(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.annotationService.create(matchId, dto);
  }

  @Patch(':annotationId')
  update(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('annotationId', ParseIntPipe) annotationId: number,
    @Body() dto: UpdateAnnotationDto,
  ) {
    return this.annotationService.update(matchId, annotationId, dto);
  }

  @Delete(':annotationId')
  remove(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('annotationId', ParseIntPipe) annotationId: number,
  ) {
    return this.annotationService.remove(matchId, annotationId);
  }
}
