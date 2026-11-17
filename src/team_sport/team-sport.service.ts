import { Injectable } from '@nestjs/common';
import { associateSport, removeSportAssociation } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { TeamService } from '../team/team.service';
import { TeamSportMapper } from './mappers/team-sport.mapper';

@Injectable()
export class TeamSportService {
  constructor(
    private readonly store: CatalogStore,
    private readonly teams: TeamService,
    private readonly mapper: TeamSportMapper,
  ) {}

  async list(teamId: number) {
    const team = await this.teams.findOne(teamId);
    return this.mapper.toResponse(team);
  }

  async associate(teamId: number, sportId: number) {
    const saved = await this.store.mutate((state) => associateSport(state, teamId, sportId));
    return { message: saved.message, sports: await this.list(teamId) };
  }

  async remove(teamId: number, sportId: number) {
    const saved = await this.store.mutate((state) => removeSportAssociation(state, teamId, sportId));
    return { message: saved.message, sports: await this.list(teamId) };
  }
}
