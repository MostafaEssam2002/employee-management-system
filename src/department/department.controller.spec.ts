jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

describe('DepartmentController', () => {
  let controller: DepartmentController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [{ provide: DepartmentService, useValue: serviceMock }],
    })
      // guards are tested separately below; here we only test the controller
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DepartmentController);
  });

  // ------------------------------------------------------------ delegation
  describe('delegation to DepartmentService', () => {
    it('create() passes the body to the service and returns its result', async () => {
      const dto = { name: 'Engineering', companyId: 1 };
      const expected = { message: 'department created successfully' };
      serviceMock.create.mockResolvedValue(expected);

      await expect(controller.create(dto)).resolves.toBe(expected);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() passes the page number to the service', async () => {
      serviceMock.findAll.mockResolvedValue({ data: [] });

      await controller.findAll({ page: 3 });

      expect(serviceMock.findAll).toHaveBeenCalledWith(3);
    });

    it('findAll() converts a string page (from the query string) to a number', async () => {
      serviceMock.findAll.mockResolvedValue({ data: [] });

      await controller.findAll({ page: '2' as unknown as number });

      expect(serviceMock.findAll).toHaveBeenCalledWith(2);
    });

    it('findAll() returns the service result as is', async () => {
      const expected = {
        message: 'departments fetched successfully',
        data: [{ id: 1, name: 'Engineering', company: 'Acme', numberOfEmployees: 3 }],
        pagination: { currentPage: 1, limit: 10, total: 1, totalPages: 1 },
      };
      serviceMock.findAll.mockResolvedValue(expected);

      await expect(controller.findAll({ page: 1 })).resolves.toBe(expected);
    });

    it('findOne() converts the id param to a number', async () => {
      serviceMock.findOne.mockResolvedValue({ data: {} });

      await controller.findOne('7');

      expect(serviceMock.findOne).toHaveBeenCalledWith(7);
    });

    it('update() converts the id param to a number and passes the body', async () => {
      const dto = { name: 'New Name', companyId: 2 };
      serviceMock.update.mockResolvedValue({ message: 'ok' });

      await controller.update('4', dto);

      expect(serviceMock.update).toHaveBeenCalledWith(4, dto);
    });

    it('remove() converts the id param to a number', async () => {
      serviceMock.remove.mockResolvedValue({ message: 'ok' });

      await controller.remove('9');

      expect(serviceMock.remove).toHaveBeenCalledWith(9);
    });

    it('propagates errors thrown by the service', async () => {
      const error = new Error('boom');
      serviceMock.findOne.mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toBe(error);
    });
  });

  // -------------------------------------------------------------- security
  describe('security', () => {
    it('is protected by JwtAuthGuard and RolesGuard', () => {
      const guards: unknown[] = Reflect.getMetadata('__guards__', DepartmentController);

      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    });

    it('requires the Admin role at class level', () => {
      expect(Reflect.getMetadata('roles', DepartmentController)).toEqual(['Admin']);
    });

    // The real RolesGuard against the real decorator metadata of the controller
    describe('RolesGuard with the controller metadata', () => {
      const guard = new RolesGuard(new Reflector());

      const contextFor = (handler: (...args: any[]) => any, user?: { role: string }) =>
        ({
          getHandler: () => handler,
          getClass: () => DepartmentController,
          switchToHttp: () => ({ getRequest: () => ({ user }) }),
        }) as unknown as ExecutionContext;

      const handlers = {
        create: DepartmentController.prototype.create,
        findAll: DepartmentController.prototype.findAll,
        findOne: DepartmentController.prototype.findOne,
        update: DepartmentController.prototype.update,
        remove: DepartmentController.prototype.remove,
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