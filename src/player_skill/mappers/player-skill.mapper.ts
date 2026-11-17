import { Injectable } from '@nestjs/common';
import { buildProfile } from '../../catalog/catalog.queries';
import type { CatalogState } from '../../catalog/catalog.types';

@Injectable()
export class PlayerSkillMapper {
  toResponse(state: CatalogState, playerId: number) {
    const profile = buildProfile(state, playerId);
    if (!profile) return null;
    return { skills: profile.skills, media: profile.media };
  }
}
