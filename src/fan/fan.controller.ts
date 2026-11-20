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
  UseInterceptors,
} from '@nestjs/common';
import { CreateFanPaymentMethodDto } from './dto/create-fan-payment-method.dto';
import { FollowTeamDto } from './dto/follow-team.dto';
import { UpdateFanPaymentMethodDto } from './dto/update-fan-payment-method.dto';
import { FanService } from './fan.service';
import { FanFollowService } from './follow/fan-follow.service';
import { CurrentFan } from './identity/current-fan.decorator';
import { FanContextInterceptor } from './identity/fan-context.interceptor';
import type { FanContext } from './identity/fan-identity.service';

@Controller('fans')
@UseInterceptors(FanContextInterceptor)
export class FanController {
  constructor(
    private readonly fanService: FanService,
    private readonly fanFollowService: FanFollowService,
  ) {}

  @Get('me')
  getProfile(@CurrentFan() context: FanContext) {
    return this.fanService.getProfile(context);
  }

  @Get('me/payment-methods')
  listPaymentMethods(@CurrentFan() context: FanContext) {
    return this.fanService.listPaymentMethods(context);
  }

  @Post('me/payment-methods')
  @HttpCode(201)
  addPaymentMethod(@CurrentFan() context: FanContext, @Body() dto: CreateFanPaymentMethodDto) {
    return this.fanService.addPaymentMethod(context, dto);
  }

  @Patch('me/payment-methods/:id')
  updatePaymentMethod(
    @CurrentFan() context: FanContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFanPaymentMethodDto,
  ) {
    return this.fanService.updatePaymentMethod(context, id, dto);
  }

  @Delete('me/payment-methods/:id')
  removePaymentMethod(@CurrentFan() context: FanContext, @Param('id', ParseIntPipe) id: number) {
    return this.fanService.removePaymentMethod(context, id);
  }

  @Get('me/followed-teams')
  listFollowedTeams(@CurrentFan() context: FanContext) {
    return this.fanFollowService.listFollowedTeams(context);
  }

  @Post('me/followed-teams')
  @HttpCode(201)
  followTeam(@CurrentFan() context: FanContext, @Body() dto: FollowTeamDto) {
    return this.fanFollowService.followTeam(context, dto.teamId);
  }

  @Delete('me/followed-teams/:teamId')
  unfollowTeam(
    @CurrentFan() context: FanContext,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.fanFollowService.unfollowTeam(context, teamId);
  }
}
