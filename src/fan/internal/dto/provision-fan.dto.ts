import { IsEmail, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ProvisionFanDto {
  @IsInt()
  @Min(1)
  externalUserId!: number;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string;
}
