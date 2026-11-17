import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export const FAN_IDENTITY_RESOLVER = 'FAN_IDENTITY_RESOLVER';

export interface FanContext {
  /** Numeric user id carried in the JWT `sub` claim (authoritative id from ms_security). */
  externalUserId: number;
  email?: string;
  token: string;
}

export interface FanProfile {
  email?: string;
  fullName?: string;
}

export interface IFanIdentityResolver {
  resolve(authorization?: string): FanContext;
  fetchRemoteProfile(context: FanContext): Promise<FanProfile | null>;
}

interface JwtPayload {
  sub?: number | string;
  email?: string;
}

@Injectable()
export class FanIdentityService implements IFanIdentityResolver {
  private readonly logger = new Logger(FanIdentityService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Extracts the fan identity from `Authorization: Bearer <token>`.
   * The token itself is not re-validated here: SecurityGuard already asked
   * ms_security for permission on every protected route.
   */
  resolve(authorization?: string): FanContext {
    const token = this.extractBearerToken(authorization);
    const payload = this.decodePayload(token);

    const externalUserId = Number(payload.sub);
    if (!Number.isInteger(externalUserId) || externalUserId <= 0) {
      throw new UnauthorizedException('The JWT does not contain a valid user id (sub).');
    }

    return {
      externalUserId,
      email: typeof payload.email === 'string' && payload.email ? payload.email : undefined,
      token,
    };
  }

  /**
   * Best effort enrichment through `GET ${MS_SECURITY}/api/users/:id` so the
   * local fan record can be completed with the data ms_security owns.
   * Returns null when the service is unreachable so business flows keep working.
   */
  async fetchRemoteProfile(context: FanContext): Promise<FanProfile | null> {
    const baseUrl = this.configService.get<string>('MS_SECURITY');
    if (!baseUrl) return null;

    try {
      const response = await axios.get(`${baseUrl}/api/users/${context.externalUserId}`, {
        headers: { Authorization: `Bearer ${context.token}` },
        timeout: 5000,
      });
      const data = (response.data ?? {}) as Record<string, unknown>;
      return {
        email: typeof data.email === 'string' && data.email ? data.email : undefined,
        fullName:
          (typeof data.fullName === 'string' && data.fullName) ||
          (typeof data.name === 'string' && data.name) ||
          undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Could not fetch remote profile for user ${context.externalUserId}: ${
          axios.isAxiosError(error)
            ? error.response?.status ?? error.code ?? 'no response'
            : 'unexpected error'
        }`,
      );
      return null;
    }
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization token.');
    }
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token || authorization.split(' ').length !== 2) {
      throw new UnauthorizedException('Invalid Authorization header format.');
    }
    return token;
  }

  private decodePayload(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new UnauthorizedException('Invalid JWT format.');
    }
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as JwtPayload;
      if (typeof payload !== 'object' || payload == null) throw new Error('not an object');
      return payload;
    } catch {
      throw new UnauthorizedException('The JWT payload could not be read.');
    }
  }
}
