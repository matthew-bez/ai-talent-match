import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, REFRESH_COOKIE } from '../auth.types';

/** What the refresh routes receive on `request.user` after validation. */
export interface RefreshUserPayload {
  id: string;
  email: string;
  refreshToken: string;
}

const fromRefreshCookie = (req: Request): string | null =>
  (req?.cookies?.[REFRESH_COOKIE] as string | undefined) ?? null;

/**
 * Validates the long-lived refresh token carried in the httpOnly cookie. The raw
 * token is passed through so AuthService can compare it against the hash stored
 * on the user record (enabling rotation + revocation).
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromRefreshCookie]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshUserPayload {
    const refreshToken = fromRefreshCookie(req);
    if (!refreshToken || !payload?.sub) {
      throw new UnauthorizedException('Refresh token missing');
    }
    return { id: payload.sub, email: payload.email, refreshToken };
  }
}
