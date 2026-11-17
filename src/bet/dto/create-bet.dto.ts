import { IsIn, IsInt, IsNumber, Max, Min } from 'class-validator';
import { BET_SELECTIONS } from '../bet.constants';

export class CreateBetDto {
  @IsInt()
  @Min(1)
  matchId!: number;

  @IsInt()
  @Min(1)
  fanPaymentMethodId!: number;

  @IsIn(BET_SELECTIONS, { message: 'Invalid selection. Use HOME, AWAY or DRAW.' })
  selection!: (typeof BET_SELECTIONS)[number];

  /** Business limits (min/max) are enforced by BetRulesConfig. */
  @IsNumber()
  @Min(0.01, { message: 'The stake must be greater than zero.' })
  @Max(1_000_000_000, { message: 'The stake value is not valid.' })
  stakeAmount!: number;
}
