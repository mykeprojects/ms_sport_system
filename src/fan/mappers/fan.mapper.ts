import { Injectable } from '@nestjs/common';
import { Fan } from '../entities/fan.entity';
import { FanPaymentMethod } from '../entities/fan-payment-method.entity';
import type { CreateFanPaymentMethodDto } from '../dto/create-fan-payment-method.dto';
import type { UpdateFanPaymentMethodDto } from '../dto/update-fan-payment-method.dto';
import {
  FanPaymentMethodResponseDto,
  FanResponseDto,
  toFanResponse,
} from '../dto/fan-response.dto';

@Injectable()
export class FanMapper {
  toFanResponse(fan: Fan): FanResponseDto {
    return toFanResponse(fan);
  }

  toPaymentMethodEntity(
    fanId: number,
    dto: CreateFanPaymentMethodDto,
  ): FanPaymentMethod {
    const entity = new FanPaymentMethod();
    entity.fanId = fanId;
    entity.paymentMethodId = dto.paymentMethodId;
    entity.maskedReference = dto.maskedReference?.trim() || '***';
    entity.holderName = dto.holderName?.trim() || null;
    entity.isActive = dto.isActive ?? true;
    return entity;
  }

  applyPaymentMethodUpdate(
    entity: FanPaymentMethod,
    dto: UpdateFanPaymentMethodDto,
  ): FanPaymentMethod {
    if (dto.maskedReference !== undefined) entity.maskedReference = dto.maskedReference.trim();
    if (dto.holderName !== undefined) entity.holderName = dto.holderName.trim();
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return entity;
  }

  toPaymentMethodResponse(
    entity: FanPaymentMethod,
    paymentMethodName: string,
  ): FanPaymentMethodResponseDto {
    return {
      id: entity.id,
      fanId: entity.fanId,
      paymentMethodId: entity.paymentMethodId,
      paymentMethodName,
      maskedReference: entity.maskedReference,
      holderName: entity.holderName,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    };
  }
}
