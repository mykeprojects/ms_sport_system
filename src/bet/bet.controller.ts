import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CreateBetDto } from './dto/create-bet.dto';
import { BetService } from './bet.service';
import { CurrentFan } from '../fan/identity/current-fan.decorator';
import { FanContextInterceptor } from '../fan/identity/fan-context.interceptor';
import type { FanContext } from '../fan/identity/fan-identity.service';

@Controller('bets')
@UseInterceptors(FanContextInterceptor)
export class BetController {
  constructor(private readonly betService: BetService) {}

  @Get('me')
  listMine(@CurrentFan() context: FanContext) {
    return this.betService.listMine(context);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentFan() context: FanContext, @Body() dto: CreateBetDto) {
    return this.betService.create(dto, context);
  }

  @Patch(':id/cancel')
  cancel(@CurrentFan() context: FanContext, @Param('id', ParseIntPipe) id: number) {
    return this.betService.cancel(id, context);
  }
}
