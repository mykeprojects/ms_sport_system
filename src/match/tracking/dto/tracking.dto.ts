import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class StartMatchTrackingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  playersPerTeam?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  fieldWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  fieldHeight?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ballName?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  simulationIntervalMs?: number;
}

export class UpdatePositionDto {
  @IsNumber()
  @Min(0)
  x!: number;

  @IsNumber()
  @Min(0)
  y!: number;
}

export class UpdateBallPositionDto extends UpdatePositionDto {
  @IsOptional()
  @IsString()
  ballName?: string;
}
