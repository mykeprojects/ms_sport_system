import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from '../payment_method/entities/payment_method.entity';
import { FanController } from './fan.controller';
import { FanService } from './fan.service';
import { Fan } from './entities/fan.entity';
import { FanPaymentMethod } from './entities/fan-payment-method.entity';
import { FanContextInterceptor } from './identity/fan-context.interceptor';
import {
  FAN_IDENTITY_RESOLVER,
  FanIdentityService,
} from './identity/fan-identity.service';
import { FanMapper } from './mappers/fan.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([Fan, FanPaymentMethod, PaymentMethod])],
  controllers: [FanController],
  providers: [
    FanService,
    FanMapper,
    FanIdentityService,
    {
      provide: FAN_IDENTITY_RESOLVER,
      useExisting: FanIdentityService,
    },
    FanContextInterceptor,
  ],
  exports: [FanService, FAN_IDENTITY_RESOLVER, FanContextInterceptor],
})
export class FanModule {}
