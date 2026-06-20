import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Validates the refresh-token cookie. Applied only to POST /auth/refresh. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
