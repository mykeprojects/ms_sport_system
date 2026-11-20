import type { Repository } from 'typeorm';
import { Fan } from '../entities/fan.entity';
import { FanProvisioningService } from './fan-provisioning.service';

describe('FanProvisioningService', () => {
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let service: FanProvisioningService;

  const fan = (overrides: Partial<Fan> = {}): Fan =>
    ({
      id: 1,
      externalUserId: 10,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
      ...overrides,
    }) as Fan;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn((data: Partial<Fan>) => data),
      save: jest.fn(),
      delete: jest.fn(),
    };
    service = new FanProvisioningService(
      repository as unknown as Repository<Fan>,
    );
  });

  it('creates a fan once for a new external user', async () => {
    const created = fan();
    repository.findOne.mockResolvedValue(null);
    repository.save.mockResolvedValue(created);

    const result = await service.provision({
      externalUserId: 10,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
    });

    expect(repository.create).toHaveBeenCalledWith({
      externalUserId: 10,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
    });
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(created);
  });

  it('returns the existing fan without creating a duplicate', async () => {
    const existing = fan();
    repository.findOne.mockResolvedValue(existing);

    const result = await service.provision({
      externalUserId: 10,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
    });

    expect(result).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('completes missing profile fields on an existing fan', async () => {
    const existing = fan({ email: null, fullName: null });
    repository.findOne.mockResolvedValue(existing);
    repository.save.mockResolvedValue(existing);

    const result = await service.provision({
      externalUserId: 10,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
    });

    expect(result.email).toBe('ana@example.com');
    expect(result.fullName).toBe('Ana Pérez');
    expect(repository.save).toHaveBeenCalledWith(existing);
  });

  it('returns the concurrent fan when the unique key wins a race', async () => {
    const existing = fan();
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    repository.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

    const result = await service.provision({
      externalUserId: 10,
      email: 'ana@example.com',
    });

    expect(result).toBe(existing);
  });

  it('deletes by external user id idempotently', async () => {
    repository.delete.mockResolvedValue({ affected: 1 });

    await service.deleteByExternalUserId(10);

    expect(repository.delete).toHaveBeenCalledWith({ externalUserId: 10 });
  });
});
