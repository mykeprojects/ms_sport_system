import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CatalogStore } from '../../catalog/catalog.store';
import { toTeam } from '../../catalog/catalog.queries';
import { Team } from '../../team/entities/team.entity';
import { Fan } from '../entities/fan.entity';
import { FanFollowedTeam } from '../entities/fan-followed-team.entity';
import type { FanContext } from '../identity/fan-identity.service';
import { FanService } from '../fan.service';
import type { FollowedTeamResponseDto } from '../dto/followed-team-response.dto';

@Injectable()
export class FanFollowService {
  constructor(
    @InjectRepository(FanFollowedTeam)
    private readonly followRepository: Repository<FanFollowedTeam>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Fan)
    private readonly fanRepository: Repository<Fan>,
    private readonly fanService: FanService,
    private readonly catalogStore: CatalogStore,
  ) {}

  async listFollowedTeams(context: FanContext): Promise<FollowedTeamResponseDto[]> {
    const fan = await this.fanService.ensureRegistered(context);
    const follows = await this.followRepository.find({
      where: { fanId: fan.id },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    if (follows.length === 0) return [];

    const teamIds = follows.map((follow) => follow.teamId);
    const teams = await this.teamRepository.find({ where: { id: In(teamIds) } });
    const byId = new Map(teams.map((team) => [team.id, team]));
    const state = await this.catalogStore.load();

    return follows
      .map((follow) => {
        const team = byId.get(follow.teamId);
        if (!team) return null;
        const view = toTeam(state, team as any);
        return {
          teamId: team.id,
          code: team.code,
          name: team.name,
          shortName: team.shortName,
          city: team.city,
          description: team.description,
          status: team.status,
          createdAt: team.createdAt,
          color: team.color,
          sports: view.sports,
          followedAt: follow.createdAt,
        } satisfies FollowedTeamResponseDto;
      })
      .filter((item): item is FollowedTeamResponseDto => item != null);
  }

  async followTeam(context: FanContext, teamId: number) {
    const fan = await this.fanService.ensureRegistered(context);
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team #${teamId} was not found.`);
    }

    const existing = await this.followRepository.findOne({
      where: { fanId: fan.id, teamId },
    });
    if (existing) {
      return { followed: true, teamId, message: 'Ya sigues este equipo.' };
    }

    try {
      await this.followRepository.save(
        this.followRepository.create({ fanId: fan.id, teamId }),
      );
    } catch (error) {
      if (this.isDuplicate(error)) {
        return { followed: true, teamId, message: 'Ya sigues este equipo.' };
      }
      throw error;
    }
    return { followed: true, teamId, message: `Ahora sigues a ${team.name}.` };
  }

  async unfollowTeam(context: FanContext, teamId: number) {
    const fan = await this.fanService.ensureRegistered(context);
    const result = await this.followRepository.delete({ fanId: fan.id, teamId });
    if (!result.affected) {
      return { followed: false, teamId, message: 'No seguías este equipo.' };
    }
    return { followed: false, teamId, message: 'Has dejado de seguir este equipo.' };
  }

  async getFollowerRecipientsForTeams(
    teamIds: number[],
  ): Promise<Array<{ fanId: number; externalUserId: number; email: string }>> {
    const uniqueTeamIds = [...new Set(teamIds.filter((id) => Number.isInteger(id) && id > 0))];
    if (uniqueTeamIds.length === 0) return [];

    const follows = await this.followRepository.find({
      where: { teamId: In(uniqueTeamIds) },
      select: { fanId: true },
    });
    if (follows.length === 0) return [];

    const fanIds = [...new Set(follows.map((follow) => follow.fanId))];
    const fans = await this.fanRepository.find({ where: { id: In(fanIds) } });
    return fans
      .filter((fan): fan is Fan & { email: string } => typeof fan.email === 'string' && fan.email.length > 0)
      .map((fan) => ({ fanId: fan.id, externalUserId: fan.externalUserId, email: fan.email }));
  }

  private isDuplicate(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
