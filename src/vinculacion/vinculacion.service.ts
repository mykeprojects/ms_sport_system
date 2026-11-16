import { Injectable, NotFoundException } from '@nestjs/common';
import { assignContract, releasePlayer, updateContract } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { VinculacionMapper } from './mappers/vinculacion.mapper';

@Injectable()
export class VinculacionService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: VinculacionMapper,
  ) {}

  async plantilla(teamId: number) {
    const state = await this.store.load();
    const roster = this.mapper.toPlantilla(state, teamId);
    if (!roster) throw new NotFoundException('No se encontró el equipo.');
    return roster;
  }

  async assign(teamId: number, jugadorId: number, startDate: string, endDate: string) {
    const saved = await this.store.mutate((state) =>
      assignContract(state, { playerId: jugadorId, teamId, startDate, endDate }),
    );
    return { message: saved.message, plantilla: await this.plantilla(teamId) };
  }

  async update(id: number, startDate: string, endDate: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('No se encontró la vinculación.');
    const saved = await this.store.mutate((state) => updateContract(state, id, startDate, endDate));
    return { message: saved.message, plantilla: await this.plantilla(current.teamId) };
  }

  async release(id: number, reason?: string, detail?: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('No se encontró la vinculación.');
    const saved = await this.store.mutate((state) => releasePlayer(state, id, reason ?? '', detail ?? ''));
    return { message: saved.message, plantilla: await this.plantilla(current.teamId) };
  }
}
