import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../team/entities/team.entity';
import { TeamSport } from '../team_sport/entities/team-sport.entity';
import { Sport } from '../sport/entities/sport.entity';
import { Tournament } from '../tournament/entities/tournament.entity';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { canManageRegistrations } from './tournament-registration.rules';

@Injectable()
export class TournamentRegistrationService {
  constructor(
    @InjectRepository(TournamentRegistration)
    private readonly registrationRepository: Repository<TournamentRegistration>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamSport)
    private readonly teamSportRepository: Repository<TeamSport>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
  ) {}

  async list(tournamentId: number) {
    await this.getTournament(tournamentId);
    const registrations = await this.registrationRepository.find({
      where: { tournamentId, status: 'REGISTERED' },
      order: { registeredAt: 'ASC' },
    });
    if (registrations.length === 0) return [];

    const teams = await this.teamRepository.findBy({
      id: In(registrations.map((item) => item.teamId)),
    });
    const teamById = new Map(teams.map((team) => [team.id, team]));
    return registrations
      .map((registration) => {
        const team = teamById.get(registration.teamId);
        return team
          ? {
              id: registration.id,
              tournamentId: registration.tournamentId,
              teamId: registration.teamId,
              status: registration.status,
              registeredAt: registration.registeredAt,
              team: {
                id: team.id,
                code: team.code,
                name: team.name,
                shortName: team.shortName,
                city: team.city,
                status: team.status,
              },
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }

  async register(tournamentId: number, teamId: number) {
    const tournament = await this.getTournament(tournamentId);
    if (!canManageRegistrations(tournament.status)) {
      throw new ConflictException('Registrations are closed for this tournament.');
    }

    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('The selected team does not exist.');

    await this.assertSportCompatibility(tournament.sportId, teamId);

    const existing = await this.registrationRepository.findOne({
      where: { tournamentId, teamId },
    });
    if (existing) {
      if (existing.status === 'REGISTERED') {
        throw new ConflictException('This team is already registered in the tournament.');
      }
      existing.status = 'REGISTERED';
      await this.registrationRepository.save(existing);
    } else {
      await this.registrationRepository.save(
        this.registrationRepository.create({ tournamentId, teamId, status: 'REGISTERED' }),
      );
    }

    return { message: `${team.name} was registered successfully.` };
  }

  async withdraw(tournamentId: number, teamId: number) {
    const tournament = await this.getTournament(tournamentId);
    if (!canManageRegistrations(tournament.status)) {
      throw new ConflictException('Registrations are closed for this tournament.');
    }
    const registration = await this.registrationRepository.findOne({
      where: { tournamentId, teamId, status: 'REGISTERED' },
    });
    if (!registration) {
      throw new NotFoundException('The team is not registered in this tournament.');
    }
    await this.registrationRepository.remove(registration);
    return { message: 'The team was withdrawn from the tournament.' };
  }

  private async getTournament(id: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({ where: { id } });
    if (!tournament) throw new NotFoundException(`Tournament #${id} was not found.`);
    return tournament;
  }

  private async assertSportCompatibility(tournamentSportId: number, teamId: number) {
    const tournamentSport = await this.sportRepository.findOne({ where: { id: tournamentSportId } });
    if (!tournamentSport) throw new NotFoundException('The tournament sport does not exist.');

    const acceptedIds = new Set<number>([tournamentSport.id]);
    if (tournamentSport.parentId == null) {
      const children = await this.sportRepository.find({
        where: { parentId: tournamentSport.id },
      });
      for (const child of children) acceptedIds.add(child.id);
    }

    const teamSports = await this.teamSportRepository.find({ where: { teamId } });
    if (!teamSports.some((link) => acceptedIds.has(link.sportId))) {
      throw new ConflictException('The team is not associated with this tournament sport.');
    }
  }
}
