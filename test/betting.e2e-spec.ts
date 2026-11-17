import 'dotenv/config';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { TestingModule } from '@nestjs/testing';
import { DataSource, In, type Repository } from 'typeorm';
import { BetModule } from '../src/bet/bet.module';
import { Bet as BetEntity } from '../src/bet/entities/bet.entity';
import { BetService } from '../src/bet/bet.service';
import { FanModule } from '../src/fan/fan.module';
import { Fan as FanEntity } from '../src/fan/entities/fan.entity';
import { FanPaymentMethod as FanPaymentMethodEntity } from '../src/fan/entities/fan-payment-method.entity';
import { FanService } from '../src/fan/fan.service';
import type { FanContext } from '../src/fan/identity/fan-identity.service';
import { MatchModule } from '../src/match/match.module';
import { Match as MatchEntity } from '../src/match/entities/match.entity';
import { MatchService } from '../src/match/match.service';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { PaymentMethod } from '../src/payment_method/entities/payment_method.entity';

/**
 * HU-GC-11 integration flow (service level, real database):
 * fan registration -> own payment methods -> bet with frozen odd ->
 * validations (stake, ownership, windows) -> cancellation ->
 * official result -> settlement exactly once.
 */
describe('HU-GC-11 betting flow', () => {
  let app: TestingModule;
  let fanService: FanService;
  let matchService: MatchService;
  let betService: BetService;
  let paymentMethodRepository: Repository<PaymentMethod>;
  let dataSource: DataSource;

  let paymentMethodId: number;
  let matchId: number;
  let secondMatchId: number;
  let fanPaymentMethodId: number;
  let cancelledBetId: number;
  let settledBetId: number;

  const fanA: FanContext = {
    externalUserId: 999001,
    email: 'hu11-fan-a@example.com',
    token: 'integration-test-token',
  };
  const fanB: FanContext = {
    externalUserId: 999002,
    email: 'hu11-fan-b@example.com',
    token: 'integration-test-token',
  };

  const futureDate = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'mysql' as const,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 3306),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
            synchronize: false,
          }),
        }),
        TypeOrmModule.forFeature([PaymentMethod]),
        FanModule,
        MatchModule,
        BetModule,
        NotificationsModule,
      ],
    }).compile();

    fanService = app.get(FanService);
    matchService = app.get(MatchService);
    betService = app.get(BetService);
    paymentMethodRepository = app.get(getRepositoryToken(PaymentMethod));
    dataSource = app.get(DataSource);

    const paymentMethod = await paymentMethodRepository.save(
      paymentMethodRepository.create({
        name: `HU11 Test PM ${Date.now()}`,
        description: 'Payment method created by the HU-GC-11 integration test.',
        is_active: true,
      }),
    );
    paymentMethodId = paymentMethod.id;

    const match = await matchService.create({
      homeTeam: 'HU11 Home FC',
      awayTeam: 'HU11 Away FC',
      homeTeamId: 1,
      awayTeamId: 2,
      startsAt: futureDate(120),
      homeOdd: 2,
      awayOdd: 3,
      drawOdd: 2.5,
    });
    matchId = match.id;

    const secondMatch = await matchService.create({
      homeTeam: 'HU11 Pending Home',
      awayTeam: 'HU11 Pending Away',
      homeTeamId: 1,
      awayTeamId: 2,
      startsAt: futureDate(180),
      homeOdd: 1.8,
      awayOdd: 2.2,
      drawOdd: 3.1,
    });
    secondMatchId = secondMatch.id;
  });

  afterAll(async () => {
    if (dataSource) {
      const externalIds = [fanA.externalUserId, fanB.externalUserId];
      const fans = await dataSource.manager.find(FanEntity, {
        where: { externalUserId: In(externalIds) },
      });
      const fanIds = fans.map((fan) => fan.id);

      await dataSource.manager.delete(BetEntity, { matchId });
      await dataSource.manager.delete(BetEntity, { matchId: secondMatchId });
      if (fanIds.length) {
        await dataSource.manager.delete(FanPaymentMethodEntity, { fanId: In(fanIds) });
        await dataSource.manager.delete(FanEntity, { id: In(fanIds) });
      }
      await dataSource.manager.delete(MatchEntity, [matchId, secondMatchId]);
      await dataSource.manager.delete(PaymentMethod, paymentMethodId);
    }
    await app?.close();
  });

  it('registers the fan on first use and enriches it from the JWT', async () => {
    const profile = await fanService.getProfile(fanA);
    expect(profile.externalUserId).toBe(fanA.externalUserId);
    expect(profile.email).toBe(fanA.email);

    await fanService.getProfile(fanB);
  });

  it('registers a payment method that belongs to the fan', async () => {
    const created = await fanService.addPaymentMethod(fanA, { paymentMethodId });
    fanPaymentMethodId = created.id;
    expect(created.fanId).toBeGreaterThan(0);
    expect(created.paymentMethodId).toBe(paymentMethodId);
    expect(created.isActive).toBe(true);

    const listed = await fanService.listPaymentMethods(fanA);
    expect(listed).toHaveLength(1);
    expect(listed[0].paymentMethodName).toContain('HU11 Test PM');
  });

  it('places a bet freezing the odd at creation time', async () => {
    const bet = await betService.create(
      { matchId, fanPaymentMethodId, selection: 'HOME', stakeAmount: 50 },
      fanA,
    );
    cancelledBetId = bet.id;

    expect(bet.status).toBe('REGISTERED');
    expect(bet.lockedOdd).toBe(2);
    expect(bet.settled).toBe(false);
    expect(bet.settledAmount).toBe(0);
  });

  it('places the bet that will be settled later', async () => {
    const bet = await betService.create(
      { matchId, fanPaymentMethodId, selection: 'HOME', stakeAmount: 30 },
      fanA,
    );
    settledBetId = bet.id;
    expect(bet.status).toBe('REGISTERED');
  });

  it('keeps the frozen odd even if the match odds change later', async () => {
    await matchService.update(matchId, { homeOdd: 5 });
    const myBets = await betService.listMine(fanA);
    const frozen = myBets.filter((bet) => bet.id === settledBetId);
    expect(frozen[0].lockedOdd).toBe(2);
    expect(frozen[0].match?.homeTeam).toBe('HU11 Home FC');
  });

  it('rejects a stake below the configured minimum', async () => {
    await expect(
      betService.create(
        { matchId, fanPaymentMethodId, selection: 'DRAW', stakeAmount: 0.5 },
        fanA,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects using a payment method that belongs to another fan', async () => {
    await expect(
      betService.create(
        { matchId, fanPaymentMethodId, selection: 'HOME', stakeAmount: 10 },
        fanB,
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      fanService.updatePaymentMethod(fanB, fanPaymentMethodId, { isActive: false }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lists only the bets of the current fan with the match summary', async () => {
    const mine = await betService.listMine(fanA);
    expect(mine).toHaveLength(2);
    expect(mine.every((bet) => bet.match?.id === matchId)).toBe(true);

    const otherFanBets = await betService.listMine(fanB);
    expect(otherFanBets).toHaveLength(0);
  });

  it('lists the bets of a match with the fan external id (administrator view)', async () => {
    const bets = await betService.listByMatch(matchId);
    expect(bets).toHaveLength(2);
    expect(bets.every((bet) => bet.fanExternalUserId === fanA.externalUserId)).toBe(true);
  });

  it('cancels a registered bet before the start and returns the stake', async () => {
    const cancelled = await betService.cancel(cancelledBetId, fanA);
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.settled).toBe(true);
    expect(cancelled.settledAmount).toBe(50);
  });

  it('rejects cancelling the same bet twice', async () => {
    await expect(betService.cancel(cancelledBetId, fanA)).rejects.toThrow(ConflictException);
  });

  it('rejects cancelling a bet of another fan', async () => {
    await expect(betService.cancel(settledBetId, fanB)).rejects.toThrow(ForbiddenException);
  });

  it('rejects new bets once the match started', async () => {
    await dataSource.manager.update(
      MatchEntity,
      matchId,
      { startsAt: new Date(Date.now() - 600_000) },
    );

    await expect(
      betService.create(
        { matchId, fanPaymentMethodId, selection: 'AWAY', stakeAmount: 10 },
        fanA,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects cancelling a bet after the match started (HU)', async () => {
    await expect(betService.cancel(settledBetId, fanA)).rejects.toThrow(ConflictException);
  });

  it('rejects settling a match that has not finished', async () => {
    await expect(betService.settle(secondMatchId)).rejects.toThrow(ConflictException);
  });

  it('records the official result of the finished match', async () => {
    const result = await matchService.registerResult(matchId, { officialResult: 'HOME' });
    expect(result.status).toBe('FINISHED');
    expect(result.officialResult).toBe('HOME');
  });

  it('settles the pending bet with the frozen odd and ignores it afterwards', async () => {
    const summary = await betService.settle(matchId);
    expect(summary.processed).toBe(1);
    expect(summary.won).toBe(1);
    expect(summary.lost).toBe(0);
    expect(summary.voided).toBe(0);
    expect(summary.totalPayout).toBe(60); // 30 * frozen odd 2 (not the updated 5)

    const bets = await betService.listByMatch(matchId);
    const settled = bets.find((bet) => bet.id === settledBetId);
    expect(settled?.status).toBe('WON');
    expect(settled?.settled).toBe(true);
    expect(settled?.settledAmount).toBe(60);

    const cancelled = bets.find((bet) => bet.id === cancelledBetId);
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.settledAmount).toBe(50);

    const secondRun = await betService.settle(matchId);
    expect(secondRun.processed).toBe(0);
  });
});
