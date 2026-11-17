import { Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { BetService } from './bet.service';

/**
 * Match scoped bet operations (sports administrator):
 * viewing the bets of a match and settling them once it finished.
 */
@Controller('matches')
export class MatchBetController {
  constructor(private readonly betService: BetService) {}

  @Get(':id/bets')
  listByMatch(@Param('id', ParseIntPipe) id: number) {
    return this.betService.listByMatch(id);
  }

  @Post(':id/settle')
  @HttpCode(200)
  settle(@Param('id', ParseIntPipe) id: number) {
    return this.betService.settle(id);
  }
}
