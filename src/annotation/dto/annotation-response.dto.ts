export class AnnotationResponseDto {
  id!: number;
  matchId!: number;
  playerId!: number;
  teamId!: number;
  minute!: number | null;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
