import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MatchTrackingService } from './match-tracking.service';
import { StartMatchTrackingDto, UpdateBallPositionDto, UpdatePositionDto } from './dto/tracking.dto';

@Controller('matches/:matchId/tracking')
export class MatchTrackingController {
  constructor(private readonly tracking: MatchTrackingService) {}

  @Get()
  board(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.tracking.board(matchId);
  }

  @Get('history')
  history(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.tracking.history(matchId);
  }

  @Post('start')
  start(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: StartMatchTrackingDto,
  ) {
    return this.tracking.start(matchId, dto);
  }

  @Post('players/:playerId/position')
  updatePlayer(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.tracking.updatePlayer(matchId, playerId, dto);
  }

  @Post('ball/position')
  updateBall(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: UpdateBallPositionDto,
  ) {
    return this.tracking.updateBall(matchId, dto);
  }

  @Post('stop')
  stop(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.tracking.stop(matchId);
  }
}
