/** Claims we embed in both access and refresh JWTs. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
}

/** Name of the httpOnly cookie carrying the refresh token. */
export const REFRESH_COOKIE = 'refresh_token';
