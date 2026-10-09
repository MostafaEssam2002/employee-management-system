jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
// AuthService pulls in @nestjs/jwt (ESM-only in some versions); the controller only needs its injection token
jest.mock('../auth/auth.service', () => ({ AuthService: class {} }));
// @nestjs/passport is ESM-only in some versions and Jest can't load it; the guard is overridden below anyway
jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { ROLE } from '../generated/prisma/enums';

describe('UserController', () => {
  let controller: UserController;

  const userServiceMock = {
    register: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const authServiceMock = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    })
      // guards are tested separately below; here we only test the controller
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UserController);
  });

  // ------------------------------------------------------------ delegation
  describe('delegation to UserService', () => {
    it('create() calls userService.register with the body and returns its result', async () => {
      const dto = {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: ROLE.Manager,
        password: 'password123',
      };
      const expected = { message: 'User created successfully' };
      userServiceMock.register.mockResolvedValue(expected);

      await expect(controller.create(dto)).resolves.toBe(expected);
      expect(userServiceMock.register).toHaveBeenCalledWith(dto);
    });

    it('create() does not go through the public AuthService.register (which forces Employee)', async () => {
      userServiceMock.register.mockResolvedValue({});

      await controller.create({
        name: 'Boss',
        email: 'boss@example.com',
        role: ROLE.Admin,
        password: 'password123',
      });

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('findAll() passes the page number to the service', async () => {
      userServiceMock.findAll.mockResolvedValue({ data: [] });

      await controller.findAll({ page: 3 });

      expect(userServiceMock.findAll).toHaveBeenCalledWith(3);
    });

    it('findAll() converts a string page (from the query string) to a number', async () => {
      userServiceMock.findAll.mockResolvedValue({ data: [] });

      await controller.findAll({ page: '2' as unknown as number });

      expect(userServiceMock.findAll).toHaveBeenCalledWith(2);
    });

    it('findOne() converts the id param to a number', async () => {
      userServiceMock.findOne.mockResolvedValue({ data: {} });

      await controller.findOne('7');

      expect(userServiceMock.findOne).toHaveBeenCalledWith(7);
    });

    it('update() converts the id param to a number and passes the body', async () => {
      const dto = { name: 'New Name' };
      userServiceMock.update.mockResolvedValue({ message: 'ok' });

      await controller.update('4', dto);

      expect(userServiceMock.update).toHaveBeenCalledWith(4, dto);
    });

    it('remove() converts the id param to a number', async () => {
      userServiceMock.remove.mockResolvedValue({ message: 'ok' });

      await controller.remove('9');

      expect(userServiceMock.remove).toHaveBeenCalledWith(9);
    });

    it('propagates errors thrown by the service', async () => {
      const error = new Error('boom');
      userServiceMock.findOne.mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toBe(error);
    });
  });

  // -------------------------------------------------------------- security
  describe('security', () => {
    it('is protected by JwtAuthGuard and RolesGuard', () => {
      const guards: unknown[] = Reflect.getMetadata('__guards__', UserController);

      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    });

    it('requires the Admin role at class level', () => {
      expect(Reflect.getMetadata('roles', UserController)).toEqual(['Admin']);
    });

    // The real RolesGuard against the real decorator metadata of the controller
    describe('RolesGuard with the controller metadata', () => {
      const guard = new RolesGuard(new Reflector());

      const contextFor = (handler: (...args: any[]) => any, user?: { role: string }) =>
        ({
          getHandler: () => handler,
          getClass: () => UserController,
          switchToHttp: () => ({ getRequest: () => ({ user }) }),
        }) as unknown as ExecutionContext;

      const handlers = {
        create: UserController.prototype.create,
        findAll: UserController.prototype.findAll,
        findOne: UserController.prototype.findOne,
        update: UserController.prototype.update,
        remove: UserController.prototype.remove,
      };

      it.each(Object.entries(handlers))('allows an Admin on %s', (_name, handler) => {
        expect(guard.canActivate(contextFor(handler, { role: 'Admin' }))).toBe(true);
      });

      it.each(Object.entries(handlers))('rejects a Manager on %s', (_name, handler) => {
        expect(() => guard.canActivate(contextFor(handler, { role: 'Manager' }))).toThrow(
          ForbiddenException,
        );
      });

      it.each(Object.entries(handlers))('rejects an Employee on %s', (_name, handler) => {
        expect(() => guard.canActivate(contextFor(handler, { role: 'Employee' }))).toThrow(
          ForbiddenException,
        );
      });

      it('rejects a request without a user', () => {
        expect(() => guard.canActivate(contextFor(handlers.findAll, undefined))).toThrow(
          ForbiddenException,
        );
      });
    });
  });
});