import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment_method.entity';
import { PaymentMethodMapper } from './mappers/payment_method.mapper';
import { PaymentMethodService } from './payment_method.service';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        PaymentMethodMapper,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
