import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import {
  FAN_IDENTITY_RESOLVER,
} from './fan-identity.service';
import type { FanContext, IFanIdentityResolver } from './fan-identity.service';

/** Request property where the resolved fan context is stored for controllers. */
export const FAN_CONTEXT = 'fanContext';

@Injectable()
export class FanContextInterceptor implements NestInterceptor {
  constructor(
    @Inject(FAN_IDENTITY_RESOLVER)
    private readonly identityResolver: IFanIdentityResolver,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request & { [FAN_CONTEXT]?: FanContext }>();
    // Errors are swallowed on purpose: routes that need the fan context throw
    // 401 from the controller/service, and SecurityGuard already validated the token.
    try {
      request[FAN_CONTEXT] = this.identityResolver.resolve(request.headers.authorization);
    } catch {
      request[FAN_CONTEXT] = undefined;
    }
    return next.handle();
  }
}
