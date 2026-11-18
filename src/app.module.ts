import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnotationModule } from './annotation/annotation.module';
import { BetModule } from './bet/bet.module';
import { CatalogCoreModule } from './catalog/catalog.module';
import { SecurityGuard } from './common/guards/security.guard';
import { SportModule } from './sport/sport.module';
import { TeamSportModule } from './team_sport/team-sport.module';
import { TeamModule } from './team/team.module';
import { FanModule } from './fan/fan.module';
import { SkillModule } from './skill/skill.module';
import { PlayerSkillModule } from './player_skill/player-skill.module';
import { PlayerModule } from './player/player.module';
import { MatchModule } from './match/match.module';
import { SportsCatalog1763220000000 } from './migrations/1763220000000-SportsCatalog';
import { InitPaymentMethods1794797184631 } from './migrations/1794797184631-InitPaymentMethods';
import { InitBetting1795100000000 } from './migrations/1795100000000-InitBetting';
import { AddPaymentMethodType1795200000000 } from './migrations/1795200000000-AddPaymentMethodType';
import { InitAnnotations1795300000000 } from './migrations/1795300000000-InitAnnotations';
import { InitMatchTracking1795400000000 } from './migrations/1795400000000-InitMatchTracking';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentMethodModule } from './payment_method/payment_method.module';
import { ContractModule } from './contract/contract.module';
import { MatchTrackingModule } from './match/tracking/match-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT') ?? 3307),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        charset: 'utf8mb4',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [
          SportsCatalog1763220000000,
          InitPaymentMethods1794797184631,
          InitBetting1795100000000,
          AddPaymentMethodType1795200000000,
          InitAnnotations1795300000000,
          InitMatchTracking1795400000000,
        ],
        migrationsRun: true,
        migrationsTableName: 'sport_migrations',
        synchronize: false,
      }),
    }),
    PaymentMethodModule,
    CatalogCoreModule,
    SportModule,
    TeamModule,
    TeamSportModule,
    PlayerModule,
    PlayerSkillModule,
    ContractModule,
    SkillModule,
    FanModule,
    MatchModule,
    MatchTrackingModule,
    BetModule,
    NotificationsModule,
    AnnotationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
  ],
})
export class AppModule {}
