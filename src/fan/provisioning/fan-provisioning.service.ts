import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fan } from '../entities/fan.entity';

export interface ProvisionFanInput {
  externalUserId: number;
  email?: string | null;
  fullName?: string | null;
}

/**
 * Owns the idempotent creation/update of fan records requested by ms_security.
 * The unique external_user_id index is the final guard against duplicates.
 */
@Injectable()
export class FanProvisioningService {
  constructor(
    @InjectRepository(Fan)
    private readonly fanRepository: Repository<Fan>,
  ) {}

  async findByExternalUserId(externalUserId: number): Promise<Fan | null> {
    return this.fanRepository.findOne({ where: { externalUserId } });
  }

  async provision(input: ProvisionFanInput): Promise<Fan> {
    const existing = await this.findByExternalUserId(input.externalUserId);
    if (existing) return this.fillMissingData(existing, input);

    try {
      return await this.fanRepository.save(
        this.fanRepository.create({
          externalUserId: input.externalUserId,
          email: input.email ?? null,
          fullName: input.fullName ?? null,
        }),
      );
    } catch (error) {
      if (!this.isDuplicateKey(error)) throw error;
      const concurrent = await this.findByExternalUserId(input.externalUserId);
      if (!concurrent) throw error;
      return this.fillMissingData(concurrent, input);
    }
  }

  async deleteByExternalUserId(externalUserId: number): Promise<void> {
    await this.fanRepository.delete({ externalUserId });
  }

  private async fillMissingData(fan: Fan, input: ProvisionFanInput): Promise<Fan> {
    let changed = false;
    if (!fan.email && input.email) {
      fan.email = input.email;
      changed = true;
    }
    if (!fan.fullName && input.fullName) {
      fan.fullName = input.fullName;
      changed = true;
    }
    return changed ? this.fanRepository.save(fan) : fan;
  }

  private isDuplicateKey(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
