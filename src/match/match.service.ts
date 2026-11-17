import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateMatchDto, RegisterResultDto, UpdateMatchDto } from './dto/match.dtos';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { BETTABLE_STATUSES, MatchStatus } from './match.constants';
import { isOpenForBetting, isSettledMatchStatus } from './match.rules';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly mapper: MatchMapper,
  ) {}

  async create(dto: CreateMatchDto) {
    const now = new Date();
    const startsAt = new Date(dto.startsAt);
    const bettingClosesAt = dto.bettingClosesAt ? new Date(dto.bettingClosesAt) : startsAt;

    if (startsAt <= now) {
      throw new BadRequestException('The match start must be in the future.');
    }
    if (bettingClosesAt > startsAt) {
      throw new BadRequestException('Betting must close before the match starts.');
    }

    try {
      const saved = await this.matchRepository.save(this.mapper.toCreateEntity(dto));
      return this.mapper.toResponse(saved);
    } catch (error) {
      if (this.isMissingReference(error)) {
        throw new NotFoundException('The selected sport does not exist.');
      }
      throw error;
    }
  }

  async list(status?: MatchStatus) {
    const matches = await this.matchRepository.find({
      where: status ? { status } : undefined,
      order: { startsAt: 'ASC' },
    });
    return this.mapper.toResponseList(matches);
  }

  /** Matches that are currently open to receive bets. */
  async listAvailable() {
    const now = new Date();
    const matches = await this.matchRepository.find({
      where: { bettingEnabled: true, status: In(BETTABLE_STATUSES) },
      order: { startsAt: 'ASC' },
    });
    return this.mapper.toResponseList(matches.filter((match) => isOpenForBetting(match, now)));
  }

  async findOne(id: number) {
    return this.mapper.toResponse(await this.getEntity(id));
  }

  async update(id: number, dto: UpdateMatchDto) {
    const match = await this.getEntity(id);
    if (isSettledMatchStatus(match.status)) {
      throw new ConflictException('A finished or cancelled match cannot be modified.');
    }

    this.mapper.applyUpdate(match, dto);
    // Keep the betting window consistent when only the start is moved.
    if (dto.startsAt !== undefined && dto.bettingClosesAt === undefined) {
      match.bettingClosesAt = match.startsAt;
    }
    if (match.bettingClosesAt > match.startsAt) {
      throw new BadRequestException('Betting must close before the match starts.');
    }

    const saved = await this.matchRepository.save(match);
    return this.mapper.toResponse(saved);
  }

  async remove(id: number) {
    const match = await this.getEntity(id);
    try {
      await this.matchRepository.remove(match);
    } catch (error) {
      if (this.isReferencedByRows(error)) {
        throw new ConflictException('A match with registered bets cannot be deleted.');
      }
      throw error;
    }
    return { message: `Match #${id} removed successfully.` };
  }

  /**
   * Records the official result. `VOID` marks the match as cancelled so its
   * bets are later settled as voided (stake returned).
   */
  async registerResult(id: number, dto: RegisterResultDto) {
    const match = await this.getEntity(id);
    if (match.status === 'FINISHED') {
      throw new ConflictException('This match already has an official result.');
    }
    if (match.status === 'CANCELLED') {
      throw new ConflictException('This match was cancelled.');
    }

    match.officialResult = dto.officialResult;
    match.status = dto.officialResult === 'VOID' ? 'CANCELLED' : 'FINISHED';
    const saved = await this.matchRepository.save(match);
    return this.mapper.toResponse(saved);
  }

  /** Loads raw entities (with odds) for queries shared with BetService. */
  async listEntities(ids: number[]): Promise<Match[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    return this.matchRepository.find({ where: { id: In(unique) } });
  }

  /** Loads the raw entity (with odds) for domain checks performed by BetService. */
  async getEntity(id: number): Promise<Match> {
    const match = await this.matchRepository.findOne({ where: { id } });
    if (!match) throw new NotFoundException(`Match #${id} was not found.`);
    return match;
  }

  /** Freezes the odd for the given selection at bet creation time. */
  getOdd(match: Match, selection: 'HOME' | 'AWAY' | 'DRAW'): number {
    const odd =
      selection === 'HOME' ? match.homeOdd : selection === 'AWAY' ? match.awayOdd : match.drawOdd;
    if (!Number.isFinite(odd) || odd < 1) {
      throw new ConflictException('The match does not have a valid odd for that selection.');
    }
    return odd;
  }

  private isReferencedByRows(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      ['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED_1'].includes(
        String((error as { code?: string }).code),
      )
    );
  }

  private isMissingReference(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error != null &&
      'code' in error &&
      ['ER_NO_REFERENCED_ROW_2', 'ER_NO_REFERENCED_ROW_1'].includes(
        String((error as { code?: string }).code),
      )
    );
  }
}
