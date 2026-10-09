jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
// @nestjs/jwt is ESM-only in some versions and Jest can't load it; the service only needs its injection token
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
import {
  BadRequestException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE } from '../generated/prisma/enums';

const HASHED = '$2b$10$hashedhashedhashedhashedhashedhashedhashedhashedhashed';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Alex Morgan',
  email: 'alex@example.com',
  role: ROLE.Employee,
  password: HASHED,
  ...overrides,
});

const registerDto = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  role: ROLE.Employee,
  password: 'password123',
};

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwtMock = {
    signAsync: jest.fn(),
  };

  const hashMock = bcrypt.hash as unknown as jest.Mock;
  const compareMock = bcrypt.compare as unknown as jest.Mock;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    hashMock.mockResolvedValue(HASHED);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ----------------------------------------------------------------- login
  describe('login', () => {
    const loginDto = { email: 'alex@example.com', password: 'password123' };

    it('throws UnauthorizedException when no user has that email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid user credentials');
    });

    it('looks the user up by email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.login(loginDto).catch(() => undefined);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'alex@example.com' } });
    });

    it('does not compare the password or sign a token for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.login(loginDto).catch(() => undefined);

      expect(compareMock).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('compares the plain password with the stored hash', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      compareMock.mockResolvedValue(false);

      await service.login(loginDto).catch(() => undefined);

      expect(compareMock).toHaveBeenCalledWith('password123', HASHED);
    });

    it('uses the same error message for an unknown email and a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const unknownEmail = await service.login(loginDto).catch((e) => e);

      prisma.user.findUnique.mockResolvedValueOnce(makeUser());
      compareMock.mockResolvedValueOnce(false);
      const wrongPassword = await service.login(loginDto).catch((e) => e);

      expect(unknownEmail.message).toBe(wrongPassword.message);
    });

    describe('with valid credentials', () => {
      beforeEach(() => {
        prisma.user.findUnique.mockResolvedValue(makeUser({ role: ROLE.Manager }));
        compareMock.mockResolvedValue(true);
        jwtMock.signAsync.mockResolvedValue('jwt-token');
      });

      it('signs a token with sub, email and role', async () => {
        await service.login(loginDto);

        expect(jwtMock.signAsync).toHaveBeenCalledWith({
          sub: 1,
          email: 'alex@example.com',
          role: ROLE.Manager,
        });
      });

      it('returns the user details and the token', async () => {
        const result = await service.login(loginDto);

        expect(result.message).toBe('login Successfully');
        expect(result.token).toBe('jwt-token');
        expect(result.data).toEqual({
          id: 1,
          name: 'Alex Morgan',
          email: 'alex@example.com',
          role: ROLE.Manager,
        });
      });

      it('never returns the password hash', async () => {
        const result = await service.login(loginDto);

        expect(result.data).not.toHaveProperty('password');
        expect(JSON.stringify(result)).not.toContain(HASHED);
      });

      it('does not put the password in the token payload', async () => {
        await service.login(loginDto);

        const payload = jwtMock.signAsync.mock.calls[0][0];
        expect(payload).not.toHaveProperty('password');
      });
    });
  });

  // -------------------------------------------------------------- register
  describe('register', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser());
    });

    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'alex@example.com' });

      await expect(service.register({ ...registerDto })).rejects.toThrow(ConflictException);
      await expect(service.register({ ...registerDto })).rejects.toThrow('Email already exists');
      expect(hashMock).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('checks the email by selecting only the email field', async () => {
      await service.register({ ...registerDto });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alex@example.com' },
        select: { email: true },
      });
    });

    it.each([
      ['Admin', ROLE.Admin],
      ['Manager', ROLE.Manager],
    ])('throws BadRequestException when registering as %s', async (_label, role) => {
      await expect(service.register({ ...registerDto, role })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register({ ...registerDto, role })).rejects.toThrow(
        'Invalid role for registration',
      );
      expect(hashMock).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('reports an existing email before checking the role', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'boss@example.com' });

      await expect(
        service.register({ ...registerDto, email: 'boss@example.com', role: ROLE.Admin }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password with 10 salt rounds and stores the hash, not the plain text', async () => {
      await service.register({ ...registerDto });

      expect(hashMock).toHaveBeenCalledWith('password123', 10);
      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data.password).toBe(HASHED);
      expect(data.password).not.toBe('password123');
    });

    it('creates the user with the supplied details and the Employee role', async () => {
      await service.register({ ...registerDto });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Alex Morgan',
          email: 'alex@example.com',
          role: ROLE.Employee,
          password: HASHED,
        },
      });
    });

    it('does not modify the dto it received', async () => {
      const dto = { ...registerDto };

      await service.register(dto);

      expect(dto.password).toBe('password123');
    });

    it('never returns the password', async () => {
      const result = await service.register({ ...registerDto });

      expect(result.message).toBe('User created successfully');
      expect(result.data).not.toHaveProperty('password');
      expect(result.data).toEqual({
        id: 1,
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: ROLE.Employee,
      });
    });

    it('does not sign a token (the user has to log in afterwards)', async () => {
      await service.register({ ...registerDto });

      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });
});