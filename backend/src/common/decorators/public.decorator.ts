import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route (or whole controller) as publicly accessible, exempting it from
 * the globally-registered JwtAuthGuard. Use on auth endpoints (login/register/
 * refresh) and any genuinely public resource (e.g. browsing job postings).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
