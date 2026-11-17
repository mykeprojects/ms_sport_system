import { Fan } from '../entities/fan.entity';

export class FanResponseDto {
  id!: number;
  externalUserId!: number;
  email!: string | null;
  fullName!: string | null;
  createdAt!: Date;
}

export class FanPaymentMethodResponseDto {
  id!: number;
  fanId!: number;
  paymentMethodId!: number;
  paymentMethodName!: string;
  maskedReference!: string;
  holderName!: string | null;
  isActive!: boolean;
  createdAt!: Date;
}

export function toFanResponse(fan: Fan): FanResponseDto {
  return {
    id: fan.id,
    externalUserId: fan.externalUserId,
    email: fan.email,
    fullName: fan.fullName,
    createdAt: fan.createdAt,
  };
}
