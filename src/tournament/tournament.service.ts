import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Sport } from '../sport/entities/sport.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './tournament.mapper';
import { canDeleteTournament, tournamentNameKey, validateTournamentDates } from './tournament.rules';
import type { TournamentStatus } from './tournament.constants';

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    private readonly mapper: TournamentMapper,
  ) {}

  async list(q?: string, status?: TournamentStatus, sportId?: number) {
    const where: Record<string, unknown>[] = [];
    const base: Record<string, unknown> = {};
    if (status) base.status = status;
    if (sportId) base.sportId = sportId;

    if (q) {
      where.push({ ...base, name: Like(`%${q}%`) });
      where.push({ ...base, location: Like(`%${q}%`) });
    }

    const tournaments = await this.tournamentRepository.find({
      where: where.length ? where : Object.keys(base).length ? base : undefined,
      order: { startDate: 'ASC', name: 'ASC' },
    });
    return tournaments.map((tournament) => this.mapper.toResponse(tournament));
  }

  async findOne(id: number) {
    const tournament = await this.tournamentRepository.findOne({ where: { id } });
    if (!tournament) throw new NotFoundException(`Tournament #${id} was not found.`);
    return this.mapper.toResponse(tournament);
  }

  async create(dto: CreateTournamentDto) {
    await this.assertSport(dto.sportId);
    const dateError = validateTournamentDates(dto.startDate, dto.endDate);
    if (dateError) throw new BadRequestException(dateError);

    const entity = this.mapper.toCreateEntity(dto);
    await this.assertUniqueName(entity.nameKey, entity.sportId);
    try {
      return this.mapper.toResponse(await this.tournamentRepository.save(entity));
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async update(id: number, dto: UpdateTournamentDto) {
    const tournament = await this.getEntity(id);
    if (dto.sportId !== undefined) await this.assertSport(dto.sportId);

    const startDate = dto.startDate ?? tournament.startDate;
    const endDate = dto.endDate ?? tournament.endDate;
    const dateError = validateTournamentDates(startDate, endDate);
    if (dateError) throw new BadRequestException(dateError);

    this.mapper.applyUpdate(tournament, dto);
    await this.assertUniqueName(tournament.nameKey, tournament.sportId, tournament.id);
    try {
      return this.mapper.toResponse(await this.tournamentRepository.save(tournament));
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async remove(id: number) {
    const tournament = await this.getEntity(id);
    if (!canDeleteTournament(tournament.status)) {
      throw new ConflictException('A tournament in progress cannot be deleted.');
    }
    await this.tournamentRepository.remove(tournament);
    return { message: `Tournament #${id} removed successfully.` };
  }

  private async getEntity(id: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({ where: { id } });
    if (!tournament) throw new NotFoundException(`Tournament #${id} was not found.`);
    return tournament;
  }

  private async assertSport(sportId: number) {
    const sport = await this.sportRepository.findOne({ where: { id: sportId } });
    if (!sport) throw new NotFoundException('The selected sport does not exist.');
  }

  private async assertUniqueName(nameKey: string, sportId: number, ignoreId?: number) {
    const duplicate = await this.tournamentRepository.findOne({
      where: { nameKey: nameKey, sportId },
    });
    if (duplicate && duplicate.id !== ignoreId) {
      throw new ConflictException('A tournament with this name already exists for the selected sport.');
    }
  }

  private mapDatabaseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      String((error as { code?: string }).code) === 'ER_DUP_ENTRY'
    ) {
      throw new ConflictException('A tournament with this name already exists for the selected sport.');
    }
    if (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      ['ER_NO_REFERENCED_ROW_2', 'ER_NO_REFERENCED_ROW_1'].includes(
        String((error as { code?: string }).code),
      )
    ) {
      throw new NotFoundException('The selected sport does not exist.');
    }
    throw error;
  }
}
