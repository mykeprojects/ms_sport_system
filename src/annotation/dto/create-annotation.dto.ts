import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAnnotationDto {
  @IsInt()
  @Min(1)
  playerId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  minute?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  description!: string;
}
