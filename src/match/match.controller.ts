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
  Query,
} from '@nestjs/common';
import { CreateMatchDto, RegisterResultDto, UpdateMatchDto } from './dto/match.dtos';
import { MatchService } from './match.service';
import type { MatchStatus } from './match.constants';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  list(@Query('status') status?: MatchStatus) {
    return this.matchService.list(status);
  }

  @Get('available')
  listAvailable() {
    return this.matchService.listAvailable();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateMatchDto) {
    return this.matchService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchDto) {
    return this.matchService.update(id, dto);
  }

  @Patch(':id/result')
  registerResult(@Param('id', ParseIntPipe) id: number, @Body() dto: RegisterResultDto) {
    return this.matchService.registerResult(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.remove(id);
  }
}
