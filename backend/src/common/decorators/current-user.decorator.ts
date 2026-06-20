import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUserPayload } from './current-user.interface';

/**
 * Resolves the authenticated user from the request.
 *
 * The JWT auth guard (next phase) is responsible for verifying the token and
 * attaching the user to `request.user`. Until that guard is wired in, requests
 * will fail here with 401 — which is the correct behaviour for protected routes.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return user;
  },
);
