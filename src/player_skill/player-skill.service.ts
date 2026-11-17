import { Injectable, NotFoundException } from '@nestjs/common';
import { assignSkill, removePlayerSkill } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';

@Injectable()
export class PlayerSkillService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: PlayerSkillMapper,
  ) {}

  async assign(playerId: number, skillId: number) {
    const saved = await this.store.mutate((state) => assignSkill(state, playerId, skillId));
    const summary = await this.summary(playerId);
    return { message: saved.message, ...summary };
  }

  async remove(playerId: number, skillId: number) {
    const saved = await this.store.mutate((state) => removePlayerSkill(state, playerId, skillId));
    const summary = await this.summary(playerId);
    return { message: saved.message, ...summary };
  }

  private async summary(playerId: number) {
    const state = await this.store.load();
    const summary = this.mapper.toResponse(state, playerId);
    if (!summary) throw new NotFoundException('Player not found.');
    return summary;
  }
}
