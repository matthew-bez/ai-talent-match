import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { CookieOptions, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, REFRESH_COOKIE } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Columns safe to return to the client (never the hashes/tokens).
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
} as const;

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, mirrors JWT_REFRESH_EXPIRES_IN

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public flows
  // ---------------------------------------------------------------------------

  async register(dto: RegisterDto, res: Response) {
    const passwordHash = await argon2.hash(dto.password);

    // A duplicate email surfaces as Prisma P2002 -> 409 via the global filter.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: PUBLIC_USER_SELECT,
    });

    const accessToken = await this.issueTokens(user.id, user.email, res);
    return { user, accessToken };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.issueTokens(user.id, user.email, res);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      accessToken,
    };
  }

  /**
   * Rotates tokens: verifies the presented refresh token against the stored
   * hash, then issues a fresh access+refresh pair (invalidating the old one).
   */
  async refresh(userId: string, presentedToken: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (
      !user?.refreshToken ||
      !(await argon2.verify(user.refreshToken, presentedToken))
    ) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const accessToken = await this.issueTokens(user.id, user.email, res);
    return { accessToken };
  }

  async logout(userId: string, res: Response) {
    // Clearing the stored hash revokes the refresh token server-side.
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    this.clearRefreshCookie(res);
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  /**
   * Signs an access + refresh token pair, persists the refresh-token hash for
   * rotation, sets the refresh cookie, and returns the access token.
   */
  private async issueTokens(
    userId: string,
    email: string,
    res: Response,
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        // getOrThrow without a generic returns `any`, satisfying the ms-based
        // StringValue type the JWT lib expects for expiresIn.
        expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await argon2.hash(refreshToken) },
    });

    this.setRefreshCookie(res, refreshToken);
    return accessToken;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth',
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }
}
