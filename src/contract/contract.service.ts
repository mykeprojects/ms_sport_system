import { Injectable, NotFoundException } from '@nestjs/common';
import { assignContract, releasePlayer, updateContract } from '../catalog/catalog.rules';
import { CatalogStore } from '../catalog/catalog.store';
import { ContractMapper } from './mappers/contract.mapper';

@Injectable()
export class ContractService {
  constructor(
    private readonly store: CatalogStore,
    private readonly mapper: ContractMapper,
  ) {}

  async roster(teamId: number) {
    const state = await this.store.load();
    const roster = this.mapper.toRoster(state, teamId);
    if (!roster) throw new NotFoundException('Team not found.');
    return roster;
  }

  async assign(teamId: number, playerId: number, startDate: string, endDate: string) {
    const saved = await this.store.mutate((state) =>
      assignContract(state, { playerId: playerId, teamId, startDate, endDate }),
    );
    return { message: saved.message, roster: await this.roster(teamId) };
  }

  async update(id: number, startDate: string, endDate: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('Contract not found.');
    const saved = await this.store.mutate((state) => updateContract(state, id, startDate, endDate));
    return { message: saved.message, roster: await this.roster(current.teamId) };
  }

  async release(id: number, reason?: string, detail?: string) {
    const before = await this.store.load();
    const current = before.contracts.find((contract) => contract.id === id);
    if (!current) throw new NotFoundException('Contract not found.');
    const saved = await this.store.mutate((state) => releasePlayer(state, id, reason ?? '', detail ?? ''));
    return { message: saved.message, roster: await this.roster(current.teamId) };
  }
}
