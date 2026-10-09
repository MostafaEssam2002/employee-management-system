/// <reference types="jest" />
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
// import { jest } from '@jest/globals';
import {BadRequestException,ConflictException,Logger,NotFoundException,} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { STATUS } from '../generated/prisma/enums';
// import { describe } from 'node:test';

const NOW = new Date('2026-10-08T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);
const daysAhead = (days: number) => new Date(NOW.getTime() + days * DAY);

const makeEmployee = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Alex Morgan',
  email: 'alex@example.com',
  mobile: '+12025550123',
  address: '123 Main Street',
  departmentId: 1,
  status: STATUS.APPLICATION_RECEIVED,
  hiredOn: null as Date | null,
  designation: 'Software Engineer',
  ...overrides,
});

const createDto = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  mobile: '+12025550123',
  address: '123 Main Street',
  departmentId: 1,
  designation: 'Software Engineer',
  companyId: 5,
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  const prisma = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
  };

  // Only Date is faked, so async/await and promises keep working normally.
  beforeAll(() => {
    Logger.overrideLogger(false);
    jest.useFakeTimers({
      now: NOW,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'queueMicrotask',
        'performance',
        'hrtime',
      ],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(EmployeeService);
  });

  // ---------------------------------------------------------------- create
  describe('create', () => {
    beforeEach(() => {
      prisma.department.findUnique.mockResolvedValue({ companyId: 5 });
      prisma.employee.findUnique.mockResolvedValue(null);
      prisma.employee.create.mockResolvedValue(makeEmployee());
    });

    it('always starts the employee at APPLICATION_RECEIVED with hiredOn = null', async () => {
      await service.create(createDto);

      const { data } = prisma.employee.create.mock.calls[0][0];
      expect(data.status).toBe(STATUS.APPLICATION_RECEIVED);
      expect(data.hiredOn).toBeNull();
    });

    it('does not persist companyId (it is only used for validation)', async () => {
      await service.create(createDto);

      const { data } = prisma.employee.create.mock.calls[0][0];
      expect(data).not.toHaveProperty('companyId');
      expect(data.departmentId).toBe(1);
    });

    it('returns the created employee', async () => {
      const result = await service.create(createDto);

      expect(result.message).toBe('employee created successfully');
      expect(result.data.employee).toEqual(makeEmployee());
    });

    it('throws NotFoundException when the department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(prisma.employee.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the department belongs to another company', async () => {
      prisma.department.findUnique.mockResolvedValue({ companyId: 99 });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(prisma.employee.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the email already exists', async () => {
      prisma.employee.findUnique.mockResolvedValue(makeEmployee({ id: 2 }));

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(prisma.employee.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- update
  describe('update', () => {
    const updateArg = () => prisma.employee.update.mock.calls[0][0];

    beforeEach(() => {
      prisma.employee.findUnique.mockResolvedValue(makeEmployee());
      prisma.employee.update.mockResolvedValue(makeEmployee());
      prisma.department.findUnique.mockResolvedValue({ companyId: 5 });
    });

    it('throws NotFoundException when the employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { address: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.employee.update).not.toHaveBeenCalled();
    });

    // ---- workflow
    describe('workflow transitions', () => {
      it.each([
        [STATUS.APPLICATION_RECEIVED, STATUS.INTERVIEW_SCHEDULED],
        [STATUS.APPLICATION_RECEIVED, STATUS.NOT_ACCEPTED],
        [STATUS.INTERVIEW_SCHEDULED, STATUS.HIRED],
        [STATUS.INTERVIEW_SCHEDULED, STATUS.NOT_ACCEPTED],
      ])('allows %s -> %s', async (from, to) => {
        prisma.employee.findUnique.mockResolvedValue(makeEmployee({ status: from }));

        await service.update(1, { status: to });

        expect(prisma.employee.update).toHaveBeenCalledTimes(1);
        expect(updateArg().data.status).toBe(to);
      });

      it.each([
        [STATUS.APPLICATION_RECEIVED, STATUS.HIRED],
        [STATUS.INTERVIEW_SCHEDULED, STATUS.APPLICATION_RECEIVED],
        [STATUS.HIRED, STATUS.APPLICATION_RECEIVED],
        [STATUS.HIRED, STATUS.INTERVIEW_SCHEDULED],
        [STATUS.HIRED, STATUS.NOT_ACCEPTED],
        [STATUS.NOT_ACCEPTED, STATUS.APPLICATION_RECEIVED],
        [STATUS.NOT_ACCEPTED, STATUS.INTERVIEW_SCHEDULED],
        [STATUS.NOT_ACCEPTED, STATUS.HIRED],
      ])('rejects %s -> %s', async (from, to) => {
        prisma.employee.findUnique.mockResolvedValue(
          makeEmployee({ status: from, hiredOn: from === STATUS.HIRED ? daysAgo(5) : null }),
        );

        await expect(service.update(1, { status: to })).rejects.toThrow(
          BadRequestException,
        );
        expect(prisma.employee.update).not.toHaveBeenCalled();
      });

      it('allows re-sending the current status (no transition)', async () => {
        prisma.employee.findUnique.mockResolvedValue(
          makeEmployee({ status: STATUS.INTERVIEW_SCHEDULED }),
        );

        await service.update(1, { status: STATUS.INTERVIEW_SCHEDULED });

        expect(prisma.employee.update).toHaveBeenCalledTimes(1);
      });
    });

    // ---- hiredOn
    describe('hiredOn rules', () => {
      const interviewScheduled = () =>
        prisma.employee.findUnique.mockResolvedValue(
          makeEmployee({ status: STATUS.INTERVIEW_SCHEDULED }),
        );

      it('sets hiredOn to now when moving to HIRED without a date', async () => {
        interviewScheduled();

        await service.update(1, { status: STATUS.HIRED });

        expect(updateArg().data.hiredOn).toEqual(NOW);
      });

      it('keeps a past hiredOn sent together with HIRED', async () => {
        interviewScheduled();
        const past = daysAgo(30);

        await service.update(1, { status: STATUS.HIRED, hiredOn: past });

        expect(updateArg().data.hiredOn).toEqual(past);
      });

      it('rejects a future hiredOn', async () => {
        interviewScheduled();

        await expect(
          service.update(1, { status: STATUS.HIRED, hiredOn: daysAhead(3) }),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.employee.update).not.toHaveBeenCalled();
      });

      it('does not wipe hiredOn when editing other fields of a hired employee', async () => {
        prisma.employee.findUnique.mockResolvedValue(
          makeEmployee({ status: STATUS.HIRED, hiredOn: daysAgo(40) }),
        );

        await service.update(1, { address: 'New address' });

        expect(updateArg().data).toEqual({ address: 'New address' });
      });

      it('sets hiredOn to null for any status other than HIRED', async () => {
        await service.update(1, { status: STATUS.INTERVIEW_SCHEDULED });

        expect(updateArg().data.hiredOn).toBeNull();
      });

      it('ignores a hiredOn sent with a non-HIRED status', async () => {
        await service.update(1, {
          status: STATUS.NOT_ACCEPTED,
          hiredOn: daysAgo(10),
        });

        expect(updateArg().data.hiredOn).toBeNull();
      });
    });

    // ---- email
    describe('email uniqueness', () => {
      it('throws ConflictException when the new email belongs to another employee', async () => {
        prisma.employee.findUnique
          .mockResolvedValueOnce(makeEmployee())
          .mockResolvedValueOnce(makeEmployee({ id: 2, email: 'taken@example.com' }));

        await expect(
          service.update(1, { email: 'taken@example.com' }),
        ).rejects.toThrow(ConflictException);
        expect(prisma.employee.update).not.toHaveBeenCalled();
      });

      it('does not look up the email when it is unchanged', async () => {
        await service.update(1, { email: 'alex@example.com' });

        // only the lookup of the employee itself
        expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.employee.update).toHaveBeenCalledTimes(1);
      });

      it('does not look up the email when it is not sent', async () => {
        await service.update(1, { address: 'New address' });

        expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
      });

      it('accepts a new email that is not used', async () => {
        prisma.employee.findUnique
          .mockResolvedValueOnce(makeEmployee())
          .mockResolvedValueOnce(null);

        await service.update(1, { email: 'new@example.com' });

        expect(updateArg().data.email).toBe('new@example.com');
      });
    });

    // ---- department / company
    describe('department and company validation', () => {
      it('throws NotFoundException when the new department does not exist', async () => {
        prisma.department.findUnique.mockResolvedValue(null);

        await expect(service.update(1, { departmentId: 42 })).rejects.toThrow(
          NotFoundException,
        );
        expect(prisma.employee.update).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when the department does not belong to companyId', async () => {
        prisma.department.findUnique.mockResolvedValue({ companyId: 5 });

        await expect(
          service.update(1, { departmentId: 2, companyId: 9 }),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.employee.update).not.toHaveBeenCalled();
      });

      it('validates companyId against the current department when departmentId is not sent', async () => {
        prisma.department.findUnique.mockResolvedValue({ companyId: 5 });

        await expect(service.update(1, { companyId: 9 })).rejects.toThrow(
          BadRequestException,
        );
        expect(prisma.department.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 1 } }),
        );
      });

      it('does not persist companyId', async () => {
        await service.update(1, { departmentId: 2, companyId: 5 });

        expect(updateArg().data).not.toHaveProperty('companyId');
        expect(updateArg().data.departmentId).toBe(2);
      });

      it('skips the department check when neither field is sent', async () => {
        await service.update(1, { address: 'New address' });

        expect(prisma.department.findUnique).not.toHaveBeenCalled();
      });
    });
  });

  // --------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('calculates daysEmployed from hiredOn', async () => {
      prisma.employee.findUnique.mockResolvedValue(
        makeEmployee({ status: STATUS.HIRED, hiredOn: daysAgo(10) }),
      );

      const result = await service.findOne(1);

      expect(result.data.daysEmployed).toBe(10);
    });

    it('rounds partial days down', async () => {
      prisma.employee.findUnique.mockResolvedValue(
        makeEmployee({ status: STATUS.HIRED, hiredOn: daysAgo(10.9) }),
      );

      const result = await service.findOne(1);

      expect(result.data.daysEmployed).toBe(10);
    });

    it('returns daysEmployed = null when the employee is not hired', async () => {
      prisma.employee.findUnique.mockResolvedValue(makeEmployee());

      const result = await service.findOne(1);

      expect(result.data.daysEmployed).toBeNull();
    });
  });

  // --------------------------------------------------------------- findAll
  describe('findAll', () => {
    beforeEach(() => {
      prisma.employee.findMany.mockResolvedValue([
        makeEmployee({ id: 1, status: STATUS.HIRED, hiredOn: daysAgo(3) }),
        makeEmployee({ id: 2 }),
      ]);
      prisma.employee.count.mockResolvedValue(25);
    });

    it('paginates with 10 items per page', async () => {
      await service.findAll(2);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('computes totalPages from the employee count', async () => {
      const result = await service.findAll(2);

      expect(prisma.employee.count).toHaveBeenCalledTimes(1);
      expect(result.pagination).toEqual({
        currentPage: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('adds daysEmployed to every employee', async () => {
      const result = await service.findAll();

      expect(result.data[0].daysEmployed).toBe(3);
      expect(result.data[1].daysEmployed).toBeNull();
    });

    it('defaults to the first page', async () => {
      await service.findAll();

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  // ---------------------------------------------------------------- remove
  describe('remove', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(prisma.employee.delete).not.toHaveBeenCalled();
    });

    it('deletes the employee and returns it', async () => {
      prisma.employee.findUnique.mockResolvedValue(makeEmployee());
      prisma.employee.delete.mockResolvedValue(makeEmployee());

      const result = await service.remove(1);

      expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.data.deletedEmp).toEqual(makeEmployee());
    });
  });
});