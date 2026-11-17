import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReleaseContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  detail?: string;
}
