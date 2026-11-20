import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogCoreModule } from '../catalog/catalog.module';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { PaymentMethod } from '../payment_method/entities/payment_method.entity';
import { Team } from '../team/entities/team.entity';
import { FanController } from './fan.controller';
import { FanService } from './fan.service';
import { Fan } from './entities/fan.entity';
import { FanFollowedTeam } from './entities/fan-followed-team.entity';
import { FanPaymentMethod } from './entities/fan-payment-method.entity';
import { FanContextInterceptor } from './identity/fan-context.interceptor';
import { FanProvisioningController } from './internal/fan-provisioning.controller';
import { FanFollowService } from './follow/fan-follow.service';
import { FanProvisioningService } from './provisioning/fan-provisioning.service';
import {
  FAN_IDENTITY_RESOLVER,
  FanIdentityService,
} from './identity/fan-identity.service';
import { FanMapper } from './mappers/fan.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fan, FanPaymentMethod, FanFollowedTeam, PaymentMethod, Team]),
    CatalogCoreModule,
  ],
  controllers: [FanController, FanProvisioningController],
  providers: [
    FanService,
    FanProvisioningService,
    FanFollowService,
    FanMapper,
    FanIdentityService,
    InternalApiKeyGuard,
    {
      provide: FAN_IDENTITY_RESOLVER,
      useExisting: FanIdentityService,
    },
    FanContextInterceptor,
  ],
  exports: [FanService, FanFollowService, FAN_IDENTITY_RESOLVER, FanContextInterceptor],
})
export class FanModule {}
