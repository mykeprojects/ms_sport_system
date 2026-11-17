import type { BetSelection, BetStatus } from '../bet.constants';
import type { MatchStatus, OfficialResult } from '../../match/match.constants';

export class BetResponseDto {
  id!: number;
  matchId!: number;
  fanId!: number;
  fanPaymentMethodId!: number;
  selection!: BetSelection;
  stakeAmount!: number;
  lockedOdd!: number;
  status!: BetStatus;
  settledAmount!: number;
  settled!: boolean;
  settledAt!: Date | null;
  createdAt!: Date;
}

export class BetMatchSummaryDto {
  id!: number;
  homeTeam!: string;
  awayTeam!: string;
  startsAt!: Date;
  status!: MatchStatus;
  officialResult!: OfficialResult | null;
}

export class BetWithMatchResponseDto extends BetResponseDto {
  match!: BetMatchSummaryDto | null;
}

export class BetWithFanResponseDto extends BetResponseDto {
  fanExternalUserId!: number;
}
