import { BadRequestException } from '@nestjs/common';
import type { Status } from './catalog.types';

export function optionalId(value?: string): number | undefined {
  if (value == null || value === '') return undefined;
  const id = Number(value);
  if (!Number.isInteger(id)) throw new BadRequestException('The identifier is invalid.');
  return id;
}

export function assertStatus(status?: string): asserts status is Status | undefined {
  if (status != null && status !== '' && status !== 'active' && status !== 'inactive') {
    throw new BadRequestException('Status must be active or inactive.');
  }
}
