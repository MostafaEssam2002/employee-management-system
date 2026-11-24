import type { CookieOptions } from 'express';

// One source of truth for how long a session lasts: the JWT and the cookie that carries it
// expire together (previously the cookie lasted 15 min but the JWT 1 h).
export const AUTH_COOKIE_NAME = 'token';
export const SESSION_MAX_AGE_MS = 15 * 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

// clearCookie only works when path/sameSite/secure match the options used to set the cookie
export const authCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});
