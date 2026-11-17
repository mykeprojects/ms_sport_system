import { Injectable } from '@nestjs/common';
import type { Fan } from '../../fan/entities/fan.entity';
import type { Match } from '../../match/entities/match.entity';
import {
  BetMatchSummaryDto,
  BetResponseDto,
  BetWithFanResponseDto,
  BetWithMatchResponseDto,
} from '../dto/bet-response.dto';
import type { Bet } from '../entities/bet.entity';

@Injectable()
export class BetMapper {
  toResponse(bet: Bet): BetResponseDto {
    return {
      id: bet.id,
      matchId: bet.matchId,
      fanId: bet.fanId,
      fanPaymentMethodId: bet.fanPaymentMethodId,
      selection: bet.selection,
      stakeAmount: bet.stakeAmount,
      lockedOdd: bet.lockedOdd,
      status: bet.status,
      settledAmount: bet.settledAmount,
      settled: bet.settled,
      settledAt: bet.settledAt,
      createdAt: bet.createdAt,
    };
  }

  toResponseWithMatch(bet: Bet, match: Match | null): BetWithMatchResponseDto {
    return {
      ...this.toResponse(bet),
      match: match ? this.toMatchSummary(match) : null,
    };
  }

  toResponseWithFan(bet: Bet, fan: Fan | undefined): BetWithFanResponseDto {
    return {
      ...this.toResponse(bet),
      fanExternalUserId: fan?.externalUserId ?? 0,
    };
  }

  private toMatchSummary(match: Match): BetMatchSummaryDto {
    return {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startsAt: match.startsAt,
      status: match.status,
      officialResult: match.officialResult,
    };
  }
}
