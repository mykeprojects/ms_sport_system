import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CancellationRules } from './bet.rules';

/**
 * Configurable initial business values for bets (HU-GC-11).
 * They can be overridden through .env without touching the business logic.
 */
@Injectable()
export class BetRulesConfig {
  constructor(private readonly configService: ConfigService) {}

  get minStakeAmount(): number {
    return this.number('BET_MIN_AMOUNT', 1);
  }

  get maxStakeAmount(): number {
    return this.number('BET_MAX_AMOUNT', 1_000_000);
  }

  get cancellationRules(): CancellationRules {
    return {
      allowCancelBeforeStart: this.boolean('ALLOW_CANCEL_BEFORE_START', true),
      allowCancelBeforeBettingClose: this.boolean('ALLOW_CANCEL_BEFORE_BETTING_CLOSE', true),
    };
  }

  private number(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    if (raw == null || raw === '') return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private boolean(key: string, fallback: boolean): boolean {
    const raw = this.configService.get<string>(key);
    if (raw == null || raw === '') return fallback;
    return ['true', '1', 'yes'].includes(raw.toLowerCase());
  }
}
