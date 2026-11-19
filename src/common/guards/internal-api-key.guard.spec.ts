import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { InternalApiKeyGuard } from './internal-api-key.guard';

function contextWith(headers: Record<string, string | string[] | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

function guardWith(key: string | undefined): InternalApiKeyGuard {
  return new InternalApiKeyGuard({
    get: () => key,
  } as unknown as ConfigService);
}

describe('InternalApiKeyGuard', () => {
  it('fails closed when the expected key is not configured', () => {
    const guard = guardWith(undefined);

    expect(() => guard.canActivate(contextWith({ 'x-internal-api-key': 'anything' }))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects requests without the header', () => {
    const guard = guardWith('secret');

    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('rejects a different key', () => {
    const guard = guardWith('secret');

    expect(() => guard.canActivate(contextWith({ 'x-internal-api-key': 'other' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts the configured key', () => {
    const guard = guardWith('secret');

    expect(guard.canActivate(contextWith({ 'x-internal-api-key': 'secret' }))).toBe(true);
  });

  it('accepts the first value when the header is repeated', () => {
    const guard = guardWith('secret');

    expect(
      guard.canActivate(contextWith({ 'x-internal-api-key': ['secret', 'other'] })),
    ).toBe(true);
  });
});
