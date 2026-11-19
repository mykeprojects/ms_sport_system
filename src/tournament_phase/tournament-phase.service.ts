import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../tournament/entities/tournament.entity';
import { CreateTournamentPhaseDto } from './dto/create-tournament-phase.dto';
import { UpdateTournamentPhaseDto } from './dto/update-tournament-phase.dto';
import { TournamentPhase } from './entities/tournament-phase.entity';
import {
  canDeletePhase,
  normalizePhaseName,
  phaseNameKey,
  validatePhaseDates,
} from './tournament-phase.rules';

@Injectable()
export class TournamentPhaseService {
  constructor(
    @InjectRepository(TournamentPhase)
    private readonly phaseRepository: Repository<TournamentPhase>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async list(tournamentId: number) {
    await this.getTournament(tournamentId);
    return this.phaseRepository.find({
      where: { tournamentId },
      order: { phaseOrder: 'ASC', id: 'ASC' },
    });
  }

  async findOne(tournamentId: number, phaseId: number) {
    await this.getTournament(tournamentId);
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId, tournamentId },
    });
    if (!phase) throw new NotFoundException(`Phase #${phaseId} was not found.`);
    return phase;
  }

  async create(tournamentId: number, dto: CreateTournamentPhaseDto) {
    const tournament = await this.getTournament(tournamentId);
    this.validateTournamentAndPhaseDates(tournament, dto.startDate, dto.endDate);

    const name = normalizePhaseName(dto.name);
    const nameKey = phaseNameKey(name);
    await this.assertUniqueNameAndOrder(tournamentId, nameKey, dto.phaseOrder);

    const phase = this.phaseRepository.create({
      tournamentId,
      name,
      nameKey,
      phaseOrder: dto.phaseOrder,
      phaseType: dto.phaseType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status ?? 'PLANNED',
    });
    try {
      return await this.phaseRepository.save(phase);
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async update(tournamentId: number, phaseId: number, dto: UpdateTournamentPhaseDto) {
    const tournament = await this.getTournament(tournamentId);
    const phase = await this.findOne(tournamentId, phaseId);
    const startDate = dto.startDate ?? phase.startDate;
    const endDate = dto.endDate ?? phase.endDate;
    this.validateTournamentAndPhaseDates(tournament, startDate, endDate);

    if (dto.name !== undefined) {
      phase.name = normalizePhaseName(dto.name);
      phase.nameKey = phaseNameKey(phase.name);
    }
    if (dto.phaseOrder !== undefined) phase.phaseOrder = dto.phaseOrder;
    if (dto.phaseType !== undefined) phase.phaseType = dto.phaseType;
    phase.startDate = startDate;
    phase.endDate = endDate;
    if (dto.status !== undefined) phase.status = dto.status;

    await this.assertUniqueNameAndOrder(
      tournamentId,
      phase.nameKey,
      phase.phaseOrder,
      phase.id,
    );
    try {
      return await this.phaseRepository.save(phase);
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async remove(tournamentId: number, phaseId: number) {
    await this.getTournament(tournamentId);
    const phase = await this.findOne(tournamentId, phaseId);
    if (!canDeletePhase(phase.status)) {
      throw new ConflictException('An in-progress phase cannot be deleted.');
    }
    await this.phaseRepository.remove(phase);
    return { message: `Phase #${phaseId} removed successfully.` };
  }

  private async getTournament(id: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({ where: { id } });
    if (!tournament) throw new NotFoundException(`Tournament #${id} was not found.`);
    return tournament;
  }

  private validateTournamentAndPhaseDates(
    tournament: Tournament,
    startDate: string,
    endDate: string,
  ) {
    const dateError = validatePhaseDates(startDate, endDate);
    if (dateError) throw new BadRequestException(dateError);
    if (startDate < tournament.startDate || endDate > tournament.endDate) {
      throw new BadRequestException(
        'The phase dates must be within the tournament start and end dates.',
      );
    }
  }

  private async assertUniqueNameAndOrder(
    tournamentId: number,
    nameKey: string,
    phaseOrder: number,
    ignoreId?: number,
  ) {
    const nameDuplicate = await this.phaseRepository.findOne({
      where: { tournamentId, nameKey },
    });
    if (nameDuplicate && nameDuplicate.id !== ignoreId) {
      throw new ConflictException('A phase with this name already exists in the tournament.');
    }
    const orderDuplicate = await this.phaseRepository.findOne({
      where: { tournamentId, phaseOrder },
    });
    if (orderDuplicate && orderDuplicate.id !== ignoreId) {
      throw new ConflictException('A phase already uses this order in the tournament.');
    }
  }

  private mapDatabaseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      String((error as { code?: string }).code) === 'ER_DUP_ENTRY'
    ) {
      throw new ConflictException('The phase name or order conflicts with another phase.');
    }
    throw error;
  }
}
