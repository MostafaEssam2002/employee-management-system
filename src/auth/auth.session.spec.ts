// ESM-only packages the current jest setup can't load; not under test here.
jest.mock('@nestjs/jwt', () => ({ JwtService: class {}, JwtModule: {} }));
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));

import { AuthController } from './auth.controller';
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_MS, authCookieOptions } from './auth.constants';

describe('AuthController session handling', () => {
  const authService = {
    login: jest.fn().mockResolvedValue({
      message: 'login Successfully',
      data: { id: 1, name: 'A', email: 'a@a.com', role: 'Employee' },
      token: 'jwt',
    }),
  };
  const controller = new AuthController(authService as any);
  const response = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

  it('login sets the cookie with the session lifetime and returns expiresAt', async () => {
    const before = Date.now();
    const res = await controller.login({ email: 'a@a.com', password: 'x' } as any, response);

    expect(response.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'jwt',
      expect.objectContaining({ maxAge: SESSION_MAX_AGE_MS, httpOnly: true, path: '/' }),
    );
    expect(res.data.expiresAt).toBeGreaterThanOrEqual(before + SESSION_MAX_AGE_MS);
    expect(res.data.expiresAt).toBeLessThanOrEqual(Date.now() + SESSION_MAX_AGE_MS);
  });

  it('logout clears the cookie using the same options it was set with', () => {
    const res = controller.logout(response);
    expect(response.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, authCookieOptions());
    expect(res).toEqual({ message: 'Logged out successfully' });
  });
});
