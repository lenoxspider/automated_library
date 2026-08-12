import { requireEnv } from './requireEnv';

export const ACCESS_SECRET = requireEnv('ACCESS_SECRET');
export const REFRESH_SECRET = requireEnv('REFRESH_SECRET');

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// sameSite: 'lax' (not 'strict') so top-level redirects like email verification
// links or OAuth-style returns still carry the cookie; 'strict' would drop it.
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000
};
