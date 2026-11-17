import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment_method.entity';
import { PaymentMethodMapper } from './mappers/payment_method.mapper';
import { PaymentMethodController } from './payment_method.controller';
import { PaymentMethodService } from './payment_method.service';

describe('PaymentMethodController', () => {
  let controller: PaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodController],
      providers: [
        PaymentMethodService,
        PaymentMethodMapper,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PaymentMethodController>(PaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
