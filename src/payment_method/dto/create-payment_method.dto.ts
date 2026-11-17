import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsEnum,
    MaxLength,
    MinLength,
    IsOptional,
} from 'class-validator';
import { PaymentMethodType } from '../payment-method.constants';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(120)
    name!: string;

    @IsString()
    @MinLength(10)
    @MaxLength(200)
    @IsNotEmpty()
    description!: string;

    @IsEnum(PaymentMethodType)
    @IsOptional()
    type?: PaymentMethodType;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
