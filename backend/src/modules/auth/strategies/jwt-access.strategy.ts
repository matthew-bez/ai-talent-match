import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../../../common/decorators/current-user.interface';
import { JwtPayload } from '../auth.types';

/**
 * Validates the short-lived access token from the `Authorization: Bearer` header
 * and returns the payload that Nest attaches to `request.user`. The returned
 * shape matches CurrentUserPayload so the @CurrentUser() decorator just works.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): CurrentUserPayload {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, email: payload.email };
  }
}
