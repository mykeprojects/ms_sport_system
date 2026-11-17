import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFanPaymentMethodDto {
  @IsInt()
  @Min(1)
  paymentMethodId!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  maskedReference?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  holderName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
