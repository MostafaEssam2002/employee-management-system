// AuthService pulls in @nestjs/jwt (ESM-only in some versions); the controller only needs its injection token
jest.mock('./auth.service', () => ({ AuthService: class {} }));
import { BadRequestException, ConflictException, RequestMethod, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ROLE } from '../generated/prisma/enums';

describe('AuthController', () => {
  let controller: AuthController;

  const serviceMock = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get(AuthController);
  });

  // ------------------------------------------------------------ delegation
  describe('delegation to AuthService', () => {
    it('login() passes the body to the service and returns its result', async () => {
      const dto = { email: 'alex@example.com', password: 'password123' };
      const expected = {
        message: 'login Successfully',
        data: { id: 1, name: 'Alex Morgan', email: dto.email, role: ROLE.Employee },
        token: 'jwt-token',
      };
      serviceMock.login.mockResolvedValue(expected);

      await expect(controller.login(dto)).resolves.toBe(expected);
      expect(serviceMock.login).toHaveBeenCalledWith(dto);
    });

    it('login() does not call register()', async () => {
      serviceMock.login.mockResolvedValue({});

      await controller.login({ email: 'alex@example.com', password: 'password123' });

      expect(serviceMock.register).not.toHaveBeenCalled();
    });

    it('login() propagates the UnauthorizedException of the service', async () => {
      const error = new UnauthorizedException('Invalid user credentials');
      serviceMock.login.mockRejectedValue(error);

      await expect(
        controller.login({ email: 'alex@example.com', password: 'wrong-password' }),
      ).rejects.toBe(error);
    });

    it('register() passes the body to the service and returns its result', async () => {
      const dto = {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: ROLE.Employee,
        password: 'password123',
      };
      const expected = { message: 'User created successfully', data: { id: 1, ...dto } };
      serviceMock.register.mockResolvedValue(expected);

      await expect(controller.register(dto)).resolves.toBe(expected);
      expect(serviceMock.register).toHaveBeenCalledWith(dto);
    });

    it('register() does not call login()', async () => {
      serviceMock.register.mockResolvedValue({});

      await controller.register({
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: ROLE.Employee,
        password: 'password123',
      });

      expect(serviceMock.login).not.toHaveBeenCalled();
    });

    it('register() propagates the ConflictException of the service (email already exists)', async () => {
      const error = new ConflictException('Email already exists');
      serviceMock.register.mockRejectedValue(error);

      await expect(
        controller.register({
          name: 'Alex Morgan',
          email: 'alex@example.com',
          role: ROLE.Employee,
          password: 'password123',
        }),
      ).rejects.toBe(error);
    });

    it('register() propagates the BadRequestException of the service (role other than Employee)', async () => {
      const error = new BadRequestException('Invalid role for registration');
      serviceMock.register.mockRejectedValue(error);

      await expect(
        controller.register({
          name: 'Boss',
          email: 'boss@example.com',
          role: ROLE.Admin,
          password: 'password123',
        }),
      ).rejects.toBe(error);
    });
  });

  // ---------------------------------------------------------------- routes
  describe('routes', () => {
    it("is mounted on 'auth'", () => {
      expect(Reflect.getMetadata('path', AuthController)).toBe('auth');
    });

    it('exposes login() as POST /auth/login', () => {
      expect(Reflect.getMetadata('path', AuthController.prototype.login)).toBe('login');
      expect(Reflect.getMetadata('method', AuthController.prototype.login)).toBe(
        RequestMethod.POST,
      );
    });

    it('exposes register() as POST /auth/register', () => {
      expect(Reflect.getMetadata('path', AuthController.prototype.register)).toBe('register');
      expect(Reflect.getMetadata('method', AuthController.prototype.register)).toBe(
        RequestMethod.POST,
      );
    });
  });

  // -------------------------------------------------------------- security
  describe('security', () => {
    // nobody has a token before logging in, so these endpoints must stay public
    it('has no guards on the controller', () => {
      expect(Reflect.getMetadata('__guards__', AuthController)).toBeUndefined();
    });

    it.each([
      ['login', AuthController.prototype.login],
      ['register', AuthController.prototype.register],
    ])('has no guards or role requirements on %s()', (_name, handler) => {
      expect(Reflect.getMetadata('__guards__', handler)).toBeUndefined();
      expect(Reflect.getMetadata('roles', handler)).toBeUndefined();
    });

    it('has no role requirement on the controller', () => {
      expect(Reflect.getMetadata('roles', AuthController)).toBeUndefined();
    });
  });
});