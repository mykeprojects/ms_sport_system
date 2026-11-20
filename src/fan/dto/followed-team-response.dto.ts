export class FollowedTeamResponseDto {
  teamId!: number;
  code!: string;
  name!: string;
  shortName!: string;
  city!: string;
  description!: string;
  status!: string;
  createdAt!: string;
  color!: string;
  sports!: { id: number; name: string; parentId: number | null }[];
  followedAt!: Date;
}
