// @nestjs/passport is ESM-only in some versions and Jest can't load it; a stand-in lets us check how the guard uses it
jest.mock('@nestjs/passport', () => {
  const passportCanActivate = jest.fn();
  class PassportGuard {
    canActivate(context: unknown) {
      return passportCanActivate(context);
    }
  }
  return {
    AuthGuard: jest.fn(() => PassportGuard),
    passportCanActivate,
  };
});
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as passport from '@nestjs/passport';
import { JwtAuthGuard } from './auth.guard';

const { AuthGuard, passportCanActivate } = passport as unknown as {
  AuthGuard: jest.Mock;
  passportCanActivate: jest.Mock;
};

// AuthGuard('jwt') runs when auth.guard.ts is loaded, so read the calls before any test can reset them
const strategyNamesUsed = AuthGuard.mock.calls.map(([name]) => name);

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const context = {
    switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    passportCanActivate.mockReset();

    guard = new JwtAuthGuard();
  });

  // -------------------------------------------------------------- strategy
  describe('strategy', () => {
    it("is built on the passport 'jwt' strategy", () => {
      expect(strategyNamesUsed).toEqual(['jwt']);
    });

    it('exposes canActivate()', () => {
      expect(typeof guard.canActivate).toBe('function');
    });

    it('can be injected (it is decorated with @Injectable)', () => {
      expect(Reflect.getMetadata('__injectable__', JwtAuthGuard)).toBe(true);
    });
  });

  // ---------------------------------------------------------- canActivate
  describe('canActivate', () => {
    it('delegates to the passport guard with the same execution context', async () => {
      passportCanActivate.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(passportCanActivate).toHaveBeenCalledTimes(1);
      expect(passportCanActivate).toHaveBeenCalledWith(context);
    });

    it('allows the request when passport accepts the token', async () => {
      passportCanActivate.mockResolvedValue(true);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('rejects the request with UnauthorizedException when passport rejects the token', async () => {
      passportCanActivate.mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('does not swallow unexpected errors from passport', async () => {
      const error = new Error('boom');
      passportCanActivate.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toBe(error);
    });
  });
});