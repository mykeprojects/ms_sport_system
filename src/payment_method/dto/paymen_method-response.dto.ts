import { PaymentMethodType } from '../payment-method.constants';

export class PaymentMethodResponseDto {
    id!: number;
    name!: string;
    description!: string;
    type!: PaymentMethodType;
    is_active!: boolean;
}