import  {IsString, IsNotEmpty, IsBoolean, MaxLength, MinLength, IsOptional} from 'class-validator';

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

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
