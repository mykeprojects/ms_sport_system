import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Team } from '../team/entities/team.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentBracket } from '../tournament_bracket/entities/tournament-bracket.entity';
import { TournamentGroup } from '../tournament_group/entities/tournament-group.entity';
import { TournamentGroupTeam } from '../tournament_group/entities/tournament-group-team.entity';
import { TournamentPhase } from '../tournament_phase/entities/tournament-phase.entity';
import { TournamentRegistration } from '../tournament_registration/entities/tournament-registration.entity';
import { CreateMatchDto, UpdateMatchDto } from './dto/match.dtos';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchNotificationService } from './match-notification.service';
import { BETTABLE_STATUSES, MatchStatus } from './match.constants';
import { Annotation } from '../annotation/entities/annotation.entity';
import { MatchTrackingSession } from './tracking/entities/match-tracking.entity';
import { BetService } from '../bet/bet.service';
import {
  isDateWithinRange,
  isDuplicateMatchSlot,
  isOpenForBetting,
  isSettledMatchStatus,
  sameTeamPair,
} from './match.rules';

interface ScopedMatchInput {
  tournamentId?: number | null;
  phaseId?: number | null;
}

interface SchedulingContext {
  tournamentId: number | null;
  phaseId: number | null;
  bracketId: number | null;
  groupId: number | null;
  homeTeamId: number;
  awayTeamId: number;
  startsAt: Date;
  roundLabel: string | null;
  excludeMatchId?: number;
}

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentPhase)
    private readonly phaseRepository: Repository<TournamentPhase>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationRepository: Repository<TournamentRegistration>,
    @InjectRepository(TournamentBracket)
    private readonly bracketRepository: Repository<TournamentBracket>,
    @InjectRepository(TournamentGroup)
    private readonly groupRepository: Repository<TournamentGroup>,
    @InjectRepository(TournamentGroupTeam)
    private readonly groupTeamRepository: Repository<TournamentGroupTeam>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Annotation)
    private readonly annotationRepository: Repository<Annotation>,
    @InjectRepository(MatchTrackingSession)
    private readonly trackingSessionRepository: Repository<MatchTrackingSession>,
    private readonly notifications: MatchNotificationService,
    private readonly mapper: MatchMapper,
    private readonly betService: BetService,
  ) {}

  async create(dto: CreateMatchDto, scoped: ScopedMatchInput = {}) {
    const tournamentId = this.resolveScopedValue(
      'tournamentId',
      dto.tournamentId ?? null,
      scoped.tournamentId ?? null,
    );
    const phaseId = this.resolveScopedValue(
      'phaseId',
      dto.phaseId ?? null,
      scoped.phaseId ?? null,
    );

    const now = new Date();
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('The match start date is invalid.');
    }
    const bettingClosesAt = dto.bettingClosesAt ? new Date(dto.bettingClosesAt) : startsAt;

    if (startsAt <= now) {
      throw new BadRequestException('The match start must be in the future.');
    }
    if (bettingClosesAt > startsAt) {
      throw new BadRequestException('Betting must close before the match starts.');
    }
    if (Number.isNaN(bettingClosesAt.getTime())) {
      throw new BadRequestException('The betting closing date is invalid.');
    }

    const { tournament } = await this.validateScheduling({
      tournamentId,
      phaseId,
      bracketId: dto.bracketId ?? null,
      groupId: dto.groupId ?? null,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      startsAt,
      roundLabel: dto.roundLabel ?? null,
    });
    this.assertSportMatchesTournament(dto.sportId, tournament);

    try {
      const entity = this.mapper.toCreateEntity({
        ...dto,
        tournamentId: tournamentId ?? undefined,
        phaseId: phaseId ?? undefined,
        sportId: dto.sportId ?? tournament?.sportId,
      });
      const saved = await this.matchRepository.save(entity);
      await this.notifications.notifyCreated(saved);
      return this.mapper.toResponse(saved, await this.scoresForMatch(saved));
    } catch (error) {
      if (this.isMissingReference(error)) {
        throw new NotFoundException('The selected sport, tournament or team does not exist.');
      }
      throw error;
    }
  }

  async list(status?: MatchStatus, tournamentId?: number, phaseId?: number) {
    const where: { status?: MatchStatus; tournamentId?: number; phaseId?: number } = {};
    if (status) where.status = status;
    if (tournamentId) where.tournamentId = tournamentId;
    if (phaseId) where.phaseId = phaseId;

    const matches = await this.matchRepository.find({
      where: Object.keys(where).length ? where : undefined,
      order: { startsAt: 'ASC' },
    });
    return this.mapper.toResponseList(matches, await this.scoresForMatches(matches));
  }

  /** Matches that are currently open to receive bets. */
  async listAvailable() {
    const now = new Date();
    const matches = await this.matchRepository.find({
      where: { bettingEnabled: true, status: In(BETTABLE_STATUSES) },
      order: { startsAt: 'ASC' },
    });
    const available = matches.filter((match) => isOpenForBetting(match, now));
    return this.mapper.toResponseList(available, await this.scoresForMatches(available));
  }

  /** Matches starting within the next `days` days, used for fan reminders. */
  async listUpcoming(days = 7) {
    const safeDays = Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), 365) : 7;
    const now = new Date();
    const until = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);
    const matches = await this.matchRepository.find({
      where: {
        startsAt: Between(now, until),
        status: Not(In(['FINISHED', 'CANCELLED'] as MatchStatus[])),
      },
      order: { startsAt: 'ASC' },
    });
    return this.mapper.toResponseList(matches, await this.scoresForMatches(matches));
  }

  async findOne(id: number) {
    const match = await this.getEntity(id);
    return this.mapper.toResponse(match, await this.scoresForMatch(match));
  }

  async update(id: number, dto: UpdateMatchDto) {
    const match = await this.getEntity(id);
    if (isSettledMatchStatus(match.status)) {
      throw new ConflictException('A finished or cancelled match cannot be modified.');
    }
    if (dto.status === 'FINISHED') {
      throw new BadRequestException(
        'Matches can only be finished through the finish endpoint using annotations.',
      );
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : match.startsAt;
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('The match start date is invalid.');
    }
    if (dto.startsAt !== undefined && startsAt <= new Date()) {
      throw new BadRequestException('The match start must be in the future.');
    }

    const tournamentId =
      dto.tournamentId !== undefined ? dto.tournamentId : match.tournamentId;
    const phaseId = dto.phaseId !== undefined ? dto.phaseId : match.phaseId;
    const bracketId = dto.bracketId !== undefined ? dto.bracketId : match.bracketId;
    const groupId = dto.groupId !== undefined ? dto.groupId : match.groupId;
    const homeTeamId = dto.homeTeamId ?? match.homeTeamId;
    const awayTeamId = dto.awayTeamId ?? match.awayTeamId;
    const roundLabel = dto.roundLabel !== undefined ? dto.roundLabel : match.roundLabel;

    const { tournament } = await this.validateScheduling({
      tournamentId,
      phaseId,
      bracketId,
      groupId,
      homeTeamId,
      awayTeamId,
      startsAt,
      roundLabel,
      excludeMatchId: match.id,
    });
    this.assertSportMatchesTournament(dto.sportId, tournament);

    const previous = this.snapshotSchedule(match);
    const previousTournamentId = match.tournamentId;
    this.mapper.applyUpdate(match, dto);
    if (
      tournament != null &&
      dto.sportId === undefined &&
      (match.tournamentId !== previousTournamentId || match.sportId == null)
    ) {
      match.sportId = tournament.sportId;
    }

    // Keep the betting window consistent when only the start is moved.
    if (dto.startsAt !== undefined && dto.bettingClosesAt === undefined) {
      match.bettingClosesAt = match.startsAt;
    }
    if (match.bettingClosesAt > match.startsAt) {
      throw new BadRequestException('Betting must close before the match starts.');
    }

    const saved = await this.matchRepository.save(match);
    if (saved.status === 'CANCELLED') {
      await this.notifications.notifyCancelled(saved);
    } else if (this.scheduleChanged(previous, saved)) {
      await this.notifications.notifyUpdated(saved);
    }
    return this.mapper.toResponse(saved, await this.scoresForMatch(saved));
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
    await this.notifications.notifyCancelled(match);
    return { message: `Match #${id} removed successfully.` };
  }

  async start(id: number) {
    const match = await this.getEntity(id);
    if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
      throw new ConflictException('A finished or cancelled match cannot be started.');
    }
    if (match.status === 'IN_PROGRESS') {
      throw new ConflictException('The match is already in progress.');
    }
    match.status = 'IN_PROGRESS';
    match.bettingEnabled = false;
    match.bettingClosesAt = match.bettingClosesAt > new Date() ? new Date() : match.bettingClosesAt;
    const saved = await this.matchRepository.save(match);
    return this.mapper.toResponse(saved, await this.scoresForMatch(saved));
  }

  async finish(id: number) {
    const match = await this.getEntity(id);
    if (match.status === 'FINISHED') {
      throw new ConflictException('This match is already finished.');
    }
    if (match.status === 'CANCELLED') {
      throw new ConflictException('A cancelled match cannot be finished.');
    }
    if (match.status !== 'IN_PROGRESS') {
      throw new ConflictException('The match must be in progress before it can be finished.');
    }

    const annotations = await this.annotationRepository.find({ where: { matchId: id } });
    const homeAnnotations = annotations.filter((annotation) => annotation.teamId === match.homeTeamId).length;
    const awayAnnotations = annotations.filter((annotation) => annotation.teamId === match.awayTeamId).length;
    match.officialResult =
      homeAnnotations > awayAnnotations ? 'HOME' :
      awayAnnotations > homeAnnotations ? 'AWAY' :
      'DRAW';
    match.status = 'FINISHED';
    match.bettingEnabled = false;
    const saved = await this.matchRepository.save(match);
    await this.stopTrackingSession(id);
    await this.betService.settle(id);
    await this.notifications.notifyFinished(saved);
    return this.mapper.toResponse(saved, await this.scoresForMatch(saved));
  }

  private async scoresForMatch(match: Match): Promise<{ homeScore: number; awayScore: number }> {
    const scores = await this.scoresForMatches([match]);
    return scores.get(match.id) ?? { homeScore: 0, awayScore: 0 };
  }

  private async scoresForMatches(
    matches: Match[],
  ): Promise<Map<number, { homeScore: number; awayScore: number }>> {
    const result = new Map<number, { homeScore: number; awayScore: number }>();
    if (matches.length === 0) return result;

    const matchById = new Map(matches.map((match) => [match.id, match]));
    const annotations = await this.annotationRepository.find({
      where: { matchId: In([...matchById.keys()]) },
    });

    for (const match of matches) {
      result.set(match.id, { homeScore: 0, awayScore: 0 });
    }
    for (const annotation of annotations) {
      const match = matchById.get(annotation.matchId);
      if (!match) continue;
      const score = result.get(match.id);
      if (!score) continue;
      if (annotation.teamId === match.homeTeamId) score.homeScore += 1;
      if (annotation.teamId === match.awayTeamId) score.awayScore += 1;
    }
    return result;
  }

  private async stopTrackingSession(matchId: number): Promise<void> {
    const session = await this.trackingSessionRepository.findOne({ where: { matchId } });
    if (!session || session.status === 'STOPPED') return;
    session.status = 'STOPPED';
    session.endedAt = new Date();
    await this.trackingSessionRepository.save(session);
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

  private async validateScheduling(
    context: SchedulingContext,
  ): Promise<{ tournament: Tournament | null }> {
    this.assertParticipantTeams(context.homeTeamId, context.awayTeamId);

    const teams = await this.teamRepository.findBy({
      id: In([context.homeTeamId, context.awayTeamId]),
    });
    if (teams.length !== 2) {
      throw new NotFoundException('One or both selected teams do not exist.');
    }

    let tournament: Tournament | null = null;
    if (context.tournamentId != null) {
      tournament = await this.tournamentRepository.findOne({
        where: { id: context.tournamentId },
      });
      if (!tournament) {
        throw new NotFoundException(`Tournament #${context.tournamentId} was not found.`);
      }
      if (!isDateWithinRange(context.startsAt, tournament.startDate, tournament.endDate)) {
        throw new BadRequestException('The match date must be within the tournament dates.');
      }
    }

    if (context.phaseId != null) {
      if (!tournament) {
        throw new BadRequestException(
          'A tournament is required when scheduling a match inside a phase.',
        );
      }
      const phase = await this.phaseRepository.findOne({ where: { id: context.phaseId } });
      if (!phase) {
        throw new NotFoundException(`Phase #${context.phaseId} was not found.`);
      }
      if (phase.tournamentId !== tournament.id) {
        throw new BadRequestException('The phase does not belong to the selected tournament.');
      }
      if (!isDateWithinRange(context.startsAt, phase.startDate, phase.endDate)) {
        throw new BadRequestException('The match date must be within the phase dates.');
      }
    }

    if (tournament) {
      await this.assertTeamsRegistered(tournament.id, [
        context.homeTeamId,
        context.awayTeamId,
      ]);
    }

    if (context.groupId != null) {
      await this.assertGroupParticipants(context);
    }
    if (context.bracketId != null) {
      await this.assertBracketParticipants(context);
    }

    await this.assertNotDuplicate(context);
    return { tournament };
  }

  private async assertTeamsRegistered(tournamentId: number, teamIds: number[]) {
    const registrations = await this.registrationRepository.find({
      where: { tournamentId, status: 'REGISTERED', teamId: In(teamIds) },
    });
    if (new Set(registrations.map((registration) => registration.teamId)).size !== 2) {
      throw new BadRequestException('Both teams must be registered in the tournament.');
    }
  }

  private async assertGroupParticipants(context: SchedulingContext) {
    if (context.phaseId == null) {
      throw new BadRequestException('A phase is required when assigning a group to a match.');
    }
    const group = await this.groupRepository.findOne({ where: { id: context.groupId as number } });
    if (!group) {
      throw new NotFoundException(`Group #${context.groupId} was not found.`);
    }
    if (group.phaseId !== context.phaseId) {
      throw new BadRequestException('The group does not belong to the selected phase.');
    }
    const links = await this.groupTeamRepository.find({
      where: {
        groupId: group.id,
        teamId: In([context.homeTeamId, context.awayTeamId]),
      },
    });
    if (new Set(links.map((link) => link.teamId)).size !== 2) {
      throw new BadRequestException('Both teams must be assigned to the selected group.');
    }
  }

  private async assertBracketParticipants(context: SchedulingContext) {
    if (context.phaseId == null) {
      throw new BadRequestException('A phase is required when linking a match to a bracket.');
    }
    const bracket = await this.bracketRepository.findOne({
      where: { id: context.bracketId as number },
    });
    if (!bracket) {
      throw new NotFoundException(`Bracket #${context.bracketId} was not found.`);
    }
    if (bracket.phaseId !== context.phaseId) {
      throw new BadRequestException('The bracket does not belong to the selected phase.');
    }
    if (bracket.status === 'CANCELLED') {
      throw new BadRequestException('A cancelled bracket cannot schedule matches.');
    }
    if (bracket.teamAId == null || bracket.teamBId == null) {
      throw new BadRequestException('The bracket does not have both participant teams yet.');
    }
    if (
      !sameTeamPair(
        context.homeTeamId,
        context.awayTeamId,
        bracket.teamAId,
        bracket.teamBId,
      )
    ) {
      throw new BadRequestException('The match teams must match the bracket participants.');
    }
  }

  private async assertNotDuplicate(context: SchedulingContext) {
    // Legacy matches are not tied to tournament or phase: keep them compatible.
    if (context.tournamentId == null && context.phaseId == null) return;

    let candidates: Match[];
    if (context.phaseId != null) {
      candidates = await this.matchRepository.find({ where: { phaseId: context.phaseId } });
    } else if (context.tournamentId != null) {
      candidates = await this.matchRepository.find({
        where: { tournamentId: context.tournamentId },
      });
    } else {
      candidates = await this.matchRepository.find({
        where: [
          { homeTeamId: context.homeTeamId, awayTeamId: context.awayTeamId },
          { homeTeamId: context.awayTeamId, awayTeamId: context.homeTeamId },
        ],
      });
    }

    const slot = {
      id: context.excludeMatchId,
      tournamentId: context.tournamentId,
      phaseId: context.phaseId,
      roundLabel: context.roundLabel,
      homeTeamId: context.homeTeamId,
      awayTeamId: context.awayTeamId,
      startsAt: context.startsAt,
    };
    const duplicated = candidates.some((candidate) =>
      isDuplicateMatchSlot(slot, {
        id: candidate.id,
        tournamentId: candidate.tournamentId,
        phaseId: candidate.phaseId,
        roundLabel: candidate.roundLabel,
        homeTeamId: candidate.homeTeamId,
        awayTeamId: candidate.awayTeamId,
        startsAt: candidate.startsAt,
      }),
    );
    if (duplicated) {
      throw new ConflictException(
        'A match with the same phase, round and teams already exists.',
      );
    }
  }

  private assertSportMatchesTournament(
    sportId: number | undefined,
    tournament: Tournament | null,
  ) {
    if (tournament && sportId != null && sportId !== tournament.sportId) {
      throw new BadRequestException('The sport must match the tournament sport.');
    }
  }

  private resolveScopedValue(
    field: 'tournamentId' | 'phaseId',
    fromBody: number | null,
    fromRoute: number | null,
  ): number | null {
    if (fromRoute != null && fromBody != null && fromRoute !== fromBody) {
      throw new BadRequestException(
        `The ${field} in the URL does not match the request body.`,
      );
    }
    return fromRoute ?? fromBody ?? null;
  }

  private snapshotSchedule(match: Match): string {
    return JSON.stringify({
      startsAt: match.startsAt.toISOString(),
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      bettingClosesAt: match.bettingClosesAt.toISOString(),
      venue: match.venue,
      roundLabel: match.roundLabel,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      tournamentId: match.tournamentId,
      phaseId: match.phaseId,
      bracketId: match.bracketId,
      groupId: match.groupId,
    });
  }

  private scheduleChanged(previous: string, current: Match): boolean {
    return previous !== this.snapshotSchedule(current);
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

  private assertParticipantTeams(homeTeamId: number, awayTeamId: number): void {
    if (!Number.isInteger(homeTeamId) || !Number.isInteger(awayTeamId)) {
      throw new BadRequestException('Both participant team IDs are required.');
    }
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException('A match must have two different participant teams.');
    }
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
