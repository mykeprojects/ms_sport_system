import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaymentMethod } from '../payment_method/entities/payment_method.entity';
import { validateFanPaymentMethodDetails } from '../payment_method/payment-method.rules';
import { CreateFanPaymentMethodDto } from './dto/create-fan-payment-method.dto';
import { UpdateFanPaymentMethodDto } from './dto/update-fan-payment-method.dto';
import { Fan } from './entities/fan.entity';
import { FanPaymentMethod } from './entities/fan-payment-method.entity';
import { FAN_IDENTITY_RESOLVER } from './identity/fan-identity.service';
import type { FanContext, IFanIdentityResolver } from './identity/fan-identity.service';
import { FanMapper } from './mappers/fan.mapper';
import { FanProvisioningService } from './provisioning/fan-provisioning.service';

@Injectable()
export class FanService {
  private readonly logger = new Logger(FanService.name);

  constructor(
    @InjectRepository(Fan)
    private readonly fanRepository: Repository<Fan>,
    @InjectRepository(FanPaymentMethod)
    private readonly fanPaymentMethodRepository: Repository<FanPaymentMethod>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @Inject(FAN_IDENTITY_RESOLVER)
    private readonly identityResolver: IFanIdentityResolver,
    private readonly mapper: FanMapper,
    private readonly provisioningService: FanProvisioningService,
  ) {}

  /**
   * Gets the local fan for the authenticated user, creating it on first use.
   * ms_security is the source of truth for registration (SecurityGuard already
   * validated the token), so remote profile loading is best effort enrichment.
   */
  async ensureRegistered(context: FanContext): Promise<Fan> {
    const existing = await this.provisioningService.findByExternalUserId(
      context.externalUserId,
    );
    if (existing) {
      if (!existing.email && context.email) {
        existing.email = context.email;
        return this.fanRepository.save(existing);
      }
      return existing;
    }

    const remote = await this.identityResolver.fetchRemoteProfile(context);
    const saved = await this.provisioningService.provision({
      externalUserId: context.externalUserId,
      email: remote?.email ?? context.email ?? null,
      fullName: remote?.fullName ?? null,
    });
    this.logger.log(`Registered fan ${saved.id} for external user ${saved.externalUserId}`);
    return saved;
  }

  async getProfile(context: FanContext) {
    const fan = await this.ensureRegistered(context);
    return this.mapper.toFanResponse(fan);
  }

  async listPaymentMethods(context: FanContext) {
    const fan = await this.ensureRegistered(context);
    const methods = await this.fanPaymentMethodRepository.find({
      where: { fanId: fan.id },
      order: { id: 'ASC' },
    });
    const names = await this.loadPaymentMethodNames(methods.map((item) => item.paymentMethodId));
    return methods.map((item) =>
      this.mapper.toPaymentMethodResponse(item, names.get(item.paymentMethodId) ?? 'Unknown'),
    );
  }

  async addPaymentMethod(context: FanContext, dto: CreateFanPaymentMethodDto) {
    const fan = await this.ensureRegistered(context);

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: dto.paymentMethodId },
    });
    if (!paymentMethod) {
      throw new NotFoundException('The selected payment method does not exist.');
    }
    if (!paymentMethod.is_active) {
      throw new ConflictException('The selected payment method is not active.');
    }

    const maskedReference = dto.maskedReference?.trim() || '***';
    const holderName = dto.holderName?.trim() || null;
    validateFanPaymentMethodDetails(paymentMethod.type, {
      maskedReference: dto.maskedReference,
      holderName,
    });
    const duplicated = await this.fanPaymentMethodRepository.findOne({
      where: { fanId: fan.id, paymentMethodId: dto.paymentMethodId, maskedReference },
    });
    if (duplicated) {
      throw new ConflictException('That payment method is already registered for this fan.');
    }

    const saved = await this.fanPaymentMethodRepository.save(
      this.mapper.toPaymentMethodEntity(fan.id, {
        ...dto,
        maskedReference,
        holderName: holderName ?? undefined,
      }),
    );
    return this.mapper.toPaymentMethodResponse(saved, paymentMethod.name);
  }

  async updatePaymentMethod(context: FanContext, id: number, dto: UpdateFanPaymentMethodDto) {
    const owned = await this.getOwnedPaymentMethod(context, id);
    const paymentMethod = await this.getPaymentMethod(owned.paymentMethodId);
    validateFanPaymentMethodDetails(paymentMethod.type, {
      maskedReference: dto.maskedReference ?? owned.maskedReference,
      holderName: dto.holderName ?? owned.holderName,
    });
    const updated = await this.fanPaymentMethodRepository.save(
      this.mapper.applyPaymentMethodUpdate(owned, dto),
    );
    const names = await this.loadPaymentMethodNames([updated.paymentMethodId]);
    return this.mapper.toPaymentMethodResponse(
      updated,
      names.get(updated.paymentMethodId) ?? 'Unknown',
    );
  }

  async removePaymentMethod(context: FanContext, id: number) {
    const owned = await this.getOwnedPaymentMethod(context, id);
    try {
      await this.fanPaymentMethodRepository.remove(owned);
    } catch (error) {
      if (this.isReferencedByRows(error)) {
        owned.isActive = false;
        const deactivated = await this.fanPaymentMethodRepository.save(owned);
        return {
          message: `Payment method #${deactivated.id} was deactivated because it is referenced by existing bets.`,
        };
      }
      throw error;
    }
    return { message: `Payment method #${id} removed successfully.` };
  }

  /**
   * Resolves a fan payment method and guarantees it belongs to the fan, is
   * active and its base payment method is active. Used by BetService so bet
   * creation never talks to repositories it does not own (DIP).
   */
  async getOwnedActivePaymentMethod(fanId: number, fanPaymentMethodId: number): Promise<FanPaymentMethod> {
    const owned = await this.fanPaymentMethodRepository.findOne({
      where: { id: fanPaymentMethodId },
    });
    if (!owned) {
      throw new NotFoundException('The selected payment method does not exist.');
    }
    if (owned.fanId !== fanId) {
      throw new ForbiddenException('That payment method does not belong to the current fan.');
    }
    if (!owned.isActive) {
      throw new ConflictException('The selected payment method is inactive.');
    }
    const paymentMethod = await this.getPaymentMethod(owned.paymentMethodId);
    validateFanPaymentMethodDetails(paymentMethod.type, {
      maskedReference: owned.maskedReference,
      holderName: owned.holderName,
    });
    if (!paymentMethod.is_active) {
      throw new ConflictException('The selected payment method is not active.');
    }
    return owned;
  }

  private async getOwnedPaymentMethod(context: FanContext, id: number): Promise<FanPaymentMethod> {
    const fan = await this.ensureRegistered(context);
    const owned = await this.fanPaymentMethodRepository.findOne({ where: { id } });
    if (!owned) {
      throw new NotFoundException(`Payment method #${id} was not found.`);
    }
    if (owned.fanId !== fan.id) {
      throw new ForbiddenException('That payment method does not belong to the current fan.');
    }
    return owned;
  }

  private async loadPaymentMethodNames(ids: number[]): Promise<Map<number, string>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const methods = await this.paymentMethodRepository.find({ where: { id: In(unique) } });
    return new Map(methods.map((method) => [method.id, method.name]));
  }

  private async getPaymentMethod(id: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException('The selected payment method does not exist.');
    }
    return paymentMethod;
  }

  private isReferencedByRows(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      ['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED_1'].includes(
        String((error as { code?: string }).code),
      )
    );
  }
}
