import { BadRequestException } from '@nestjs/common';
import { PaymentMethodType } from './payment-method.constants';

export interface FanPaymentMethodDetails {
  maskedReference?: string | null;
  holderName?: string | null;
}

/**
 * Validates only details owned by the fan association. The payment method
 * catalog owns the type, while this rule owns the type-specific requirements.
 */
export function validateFanPaymentMethodDetails(
  type: PaymentMethodType,
  details: FanPaymentMethodDetails,
): void {
  const hasReference =
    typeof details.maskedReference === 'string' &&
    details.maskedReference.trim().length > 0 &&
    details.maskedReference.trim() !== '***';
  const referenceRequired =
    type === PaymentMethodType.CARD ||
    type === PaymentMethodType.BANK_ACCOUNT ||
    type === PaymentMethodType.DIGITAL_WALLET;

  if (referenceRequired && !hasReference) {
    throw new BadRequestException(
      'A masked reference is required for this payment method type.',
    );
  }

  const holderRequired =
    type === PaymentMethodType.CARD || type === PaymentMethodType.BANK_ACCOUNT;
  if (holderRequired && !details.holderName?.trim()) {
    throw new BadRequestException(
      'The holder name is required for this payment method type.',
    );
  }
}
