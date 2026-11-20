import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

const INTERNAL_API_KEY_HEADER = 'x-internal-api-key';

/**
 * Protects service-to-service endpoints that cannot use a user JWT.
 * The shared key is configured through INTERNAL_API_KEY and the check fails
 * closed when the key is not configured.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('INTERNAL_API_KEY');
    if (!expected) {
      throw new ServiceUnavailableException('Internal API key is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers[INTERNAL_API_KEY_HEADER];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided || !this.safeEquals(expected, provided)) {
      throw new UnauthorizedException('Invalid internal API key.');
    }
    return true;
  }

  private safeEquals(expected: string, provided: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    return (
      expectedBuffer.length === providedBuffer.length &&
      timingSafeEqual(expectedBuffer, providedBuffer)
    );
  }
}
