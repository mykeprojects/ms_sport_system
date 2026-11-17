import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { FanContext } from './fan-identity.service';
import { FAN_CONTEXT } from './fan-context.interceptor';

export const CurrentFan = createParamDecorator(
  (_data: unknown, context: ExecutionContext): FanContext => {
    const request = context.switchToHttp().getRequest<Request & { [FAN_CONTEXT]?: FanContext }>();
    const fanContext = request[FAN_CONTEXT];
    if (!fanContext) {
      throw new UnauthorizedException('The current fan could not be resolved from the token.');
    }
    return fanContext;
  },
);
