import { IsBoolean, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateFanPaymentMethodDto {
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
