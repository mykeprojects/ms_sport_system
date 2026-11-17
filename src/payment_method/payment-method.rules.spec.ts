import { BadRequestException } from '@nestjs/common';
import { PaymentMethodType } from './payment-method.constants';
import { validateFanPaymentMethodDetails } from './payment-method.rules';

describe('payment method rules', () => {
  it('requires reference and holder for cards', () => {
    expect(() =>
      validateFanPaymentMethodDetails(PaymentMethodType.CARD, {}),
    ).toThrow(BadRequestException);

    expect(() =>
      validateFanPaymentMethodDetails(PaymentMethodType.CARD, {
        maskedReference: '***',
        holderName: 'Fan',
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts a valid digital wallet with a masked reference', () => {
    expect(() =>
      validateFanPaymentMethodDetails(PaymentMethodType.DIGITAL_WALLET, {
        maskedReference: 'wallet-user',
      }),
    ).not.toThrow();
  });

  it('does not impose card fields on other methods', () => {
    expect(() =>
      validateFanPaymentMethodDetails(PaymentMethodType.OTHER, {}),
    ).not.toThrow();
  });
});
