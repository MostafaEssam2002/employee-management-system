jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { STATUS } from '../generated/prisma/enums';

describe('EmployeeController', () => {
  let controller: EmployeeController;

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
      controllers: [EmployeeController],
      providers: [{ provide: EmployeeService, useValue: serviceMock }],
    })
      // guards are tested separately below; here we only test the controller
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(EmployeeController);
  });

  // ------------------------------------------------------------ delegation
  describe('delegation to EmployeeService', () => {
    it('create() passes the body to the service and returns its result', async () => {
      const dto = {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        mobile: '+12025550123',
        address: '123 Main Street',
        departmentId: 1,
        designation: 'Software Engineer',
        companyId: 5,
      };
      const expected = { message: 'employee created successfully' };
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

    it('findOne() converts the id param to a number', async () => {
      serviceMock.findOne.mockResolvedValue({ data: {} });

      await controller.findOne('7');

      expect(serviceMock.findOne).toHaveBeenCalledWith(7);
    });

    it('update() converts the id param to a number and passes the body', async () => {
      const dto = { status: STATUS.INTERVIEW_SCHEDULED };
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
      const guards: unknown[] = Reflect.getMetadata('__guards__', EmployeeController);

      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    });

    it('requires the Admin role at class level', () => {
      expect(Reflect.getMetadata('roles', EmployeeController)).toEqual(['Admin']);
    });

    // The real RolesGuard against the real decorator metadata of the controller
    describe('RolesGuard with the controller metadata', () => {
      const guard = new RolesGuard(new Reflector());

      const contextFor = (handler: (...args: any[]) => any, user?: { role: string }) =>
        ({
          getHandler: () => handler,
          getClass: () => EmployeeController,
          switchToHttp: () => ({ getRequest: () => ({ user }) }),
        }) as unknown as ExecutionContext;

      const handlers = {
        create: EmployeeController.prototype.create,
        findAll: EmployeeController.prototype.findAll,
        findOne: EmployeeController.prototype.findOne,
        update: EmployeeController.prototype.update,
        remove: EmployeeController.prototype.remove,
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