import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BetModule } from './bet/bet.module';
import { CatalogCoreModule } from './catalog/catalog.module';
import { SecurityGuard } from './common/guards/security.guard';
import { DeporteModule } from './deporte/deporte.module';
import { EquipoDeporteModule } from './equipo_deporte/equipo-deporte.module';
import { EquipoModule } from './equipo/equipo.module';
import { FanModule } from './fan/fan.module';
import { HabilidadModule } from './habilidad/habilidad.module';
import { JugadorHabilidadModule } from './jugador_habilidad/jugador-habilidad.module';
import { JugadorModule } from './jugador/jugador.module';
import { MatchModule } from './match/match.module';
import { CatalogoDeportivo1763220000000 } from './migrations/1763220000000-CatalogoDeportivo';
import { InitBetting1795100000000 } from './migrations/1795100000000-InitBetting';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentMethodModule } from './payment_method/payment_method.module';
import { VinculacionModule } from './vinculacion/vinculacion.module';

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
        migrations: [CatalogoDeportivo1763220000000, InitBetting1795100000000],
        migrationsRun: true,
        migrationsTableName: 'sport_migrations',
        synchronize: false,
      }),
    }),
    PaymentMethodModule,
    CatalogCoreModule,
    DeporteModule,
    EquipoModule,
    EquipoDeporteModule,
    JugadorModule,
    JugadorHabilidadModule,
    VinculacionModule,
    HabilidadModule,
    FanModule,
    MatchModule,
    BetModule,
    NotificationsModule,
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
