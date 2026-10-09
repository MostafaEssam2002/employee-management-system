// @nestjs/passport can't be loaded by Jest here (see auth.guard.spec.ts); a stand-in base class is enough to test validate()
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn(() => class {}),
}));
// the strategy only needs these two as injection tokens; the real ones can't be loaded by Jest here
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ROLE } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const prisma = { user: { findUnique: jest.fn() } };
  const config = { get: jest.fn().mockReturnValue('test-secret') };

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockReturnValue('test-secret');
    strategy = new JwtStrategy(config as unknown as ConfigService, prisma as unknown as PrismaService);
  });

  it('looks the user up by the token subject (id), not by email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, email: 'a@a.com', role: ROLE.Admin });

    await strategy.validate({ sub: 5, email: 'a@a.com', role: ROLE.Admin });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } }),
    );
  });

  it('returns the current user data when the token matches the DB', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, email: 'a@a.com', role: ROLE.Manager });

    await expect(
      strategy.validate({ sub: 5, email: 'a@a.com', role: ROLE.Manager }),
    ).resolves.toEqual({ sub: 5, email: 'a@a.com', role: ROLE.Manager });
  });

  it('rejects a token whose user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 99, email: 'x@x.com', role: ROLE.Admin }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token whose role no longer matches the DB', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, email: 'a@a.com', role: ROLE.Employee });

    await expect(
      strategy.validate({ sub: 5, email: 'a@a.com', role: ROLE.Admin }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('uses the same generic message for both rejections so the reason is not leaked', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const deleted = await strategy
      .validate({ sub: 1, email: 'a@a.com', role: ROLE.Admin })
      .catch((e) => e.message);

    prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'a@a.com', role: ROLE.Employee });
    const demoted = await strategy
      .validate({ sub: 1, email: 'a@a.com', role: ROLE.Admin })
      .catch((e) => e.message);

    expect(deleted).toBe('Invalid or expired token');
    expect(demoted).toBe('Invalid or expired token');
  });
});