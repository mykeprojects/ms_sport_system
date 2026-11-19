import type { TournamentStatus } from '../tournament.constants';

export class TournamentResponseDto {
  id: number;
  name: string;
  nameKey: string;
  description: string;
  sportId: number;
  location: string | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
}
