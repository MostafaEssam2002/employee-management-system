jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DepartmentService', () => {
  let service: DepartmentService;

  const prisma = {
    department: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DepartmentService);
  });

  // ---------------------------------------------------------------- create
  describe('create', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.create({ name: 'Engineering', companyId: 99 })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.department.create).not.toHaveBeenCalled();
    });

    it('looks the company up by the supplied companyId', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await service.create({ name: 'Engineering', companyId: 5 }).catch(() => undefined);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('creates the department with its name and companyId', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Acme' });
      prisma.department.create.mockResolvedValue({ id: 1, name: 'Engineering', companyId: 1 });

      const result = await service.create({ name: 'Engineering', companyId: 1 });

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { name: 'Engineering', companyId: 1 },
      });
      expect(result.message).toBe('department created successfully');
      expect(result.data).toEqual({ id: 1, name: 'Engineering', companyId: 1 });
    });
  });

  // --------------------------------------------------------------- findAll
  describe('findAll', () => {
    const departmentsPage = [
      { id: 1, name: 'Engineering', company: { name: 'Acme' }, _count: { employees: 7 } },
      { id: 2, name: 'HR', company: { name: 'Acme' }, _count: { employees: 0 } },
      { id: 3, name: 'Sales', company: { name: 'Globex' }, _count: { employees: 4 } },
    ];

    beforeEach(() => {
      prisma.department.findMany.mockResolvedValue(departmentsPage);
      prisma.department.count.mockResolvedValue(25);
    });

    it('paginates with a fixed limit of 10', async () => {
      await service.findAll(3);

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('defaults to the first page when no page is given', async () => {
      const result = await service.findAll();

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(result.pagination.currentPage).toBe(1);
    });

    it('selects the company name and the employee count', async () => {
      await service.findAll(1);

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            company: { select: { name: true } },
            _count: { select: { employees: true } },
          },
        }),
      );
    });

    it('flattens every department to id, name, company name and numberOfEmployees', async () => {
      const result = await service.findAll(1);

      expect(result.message).toBe('departments fetched successfully');
      expect(result.data).toEqual([
        { id: 1, name: 'Engineering', company: 'Acme', numberOfEmployees: 7 },
        { id: 2, name: 'HR', company: 'Acme', numberOfEmployees: 0 },
        { id: 3, name: 'Sales', company: 'Globex', numberOfEmployees: 4 },
      ]);
    });

    it('computes the pagination details', async () => {
      const result = await service.findAll(2);

      expect(result.pagination).toEqual({ currentPage: 2, limit: 10, total: 25, totalPages: 3 });
    });

    it('returns an empty list for an empty page', async () => {
      prisma.department.findMany.mockResolvedValue([]);
      prisma.department.count.mockResolvedValue(0);

      const result = await service.findAll(1);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // --------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('throws NotFoundException when the department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('looks the department up by id with its company name and employee count', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await service.findOne(7).catch(() => undefined);

      expect(prisma.department.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: {
          id: true,
          name: true,
          company: { select: { name: true } },
          _count: { select: { employees: true } },
        },
      });
    });

    it('returns the department with its company name and number of employees', async () => {
      prisma.department.findUnique.mockResolvedValue({
        id: 1,
        name: 'Engineering',
        company: { name: 'Acme' },
        _count: { employees: 12 },
      });

      const result = await service.findOne(1);

      expect(result.message).toBe('department fetched successfully');
      expect(result.data).toEqual({
        id: 1,
        name: 'Engineering',
        company: 'Acme',
        numberOfEmployees: 12,
      });
    });
  });

  // ---------------------------------------------------------------- update
  describe('update', () => {
    it('throws NotFoundException when the department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { name: 'New' })).rejects.toThrow(NotFoundException);
      expect(prisma.department.update).not.toHaveBeenCalled();
    });

    it('does not look the company up when the department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await service.update(1, { companyId: 2 }).catch(() => undefined);

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it('updates the name without touching the company when companyId is not supplied', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Old', companyId: 1 });
      prisma.department.update.mockResolvedValue({ id: 1, name: 'New', companyId: 1 });

      const result = await service.update(1, { name: 'New' });

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New' },
      });
      expect(result.message).toBe('Department updated successfully');
      expect(result.data).toEqual({ id: 1, name: 'New', companyId: 1 });
    });

    it('moves the department to another company when it exists', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });
      prisma.company.findUnique.mockResolvedValue({ id: 2, name: 'Globex' });
      prisma.department.update.mockResolvedValue({ id: 1, name: 'Eng', companyId: 2 });

      const result = await service.update(1, { companyId: 2 });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { companyId: 2 },
      });
      expect(result.data).toEqual({ id: 1, name: 'Eng', companyId: 2 });
    });

    it('converts a string companyId to a number before saving it', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });
      prisma.company.findUnique.mockResolvedValue({ id: 2, name: 'Globex' });
      prisma.department.update.mockResolvedValue({ id: 1, name: 'Eng', companyId: 2 });

      await service.update(1, { companyId: '2' as unknown as number });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { companyId: 2 },
      });
    });

    it('throws NotFoundException when the new company does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { companyId: 99 })).rejects.toThrow(NotFoundException);
      expect(prisma.department.update).not.toHaveBeenCalled();
    });

    it.each([
      ['zero', 0],
      ['a negative number', -3],
      ['a decimal', 1.5],
      ['a non-numeric string', 'abc'],
      ['null', null],
    ])('throws BadRequestException when companyId is %s', async (_label, companyId) => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });

      await expect(service.update(1, { companyId } as any)).rejects.toThrow(BadRequestException);
      expect(prisma.company.findUnique).not.toHaveBeenCalled();
      expect(prisma.department.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- remove
  describe('remove', () => {
    it('throws NotFoundException when the department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(prisma.department.delete).not.toHaveBeenCalled();
    });

    it('deletes the department and returns it', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });
      prisma.department.delete.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });

      const result = await service.remove(1);

      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toBe('department deleted successfully');
      expect(result.data).toEqual({ id: 1, name: 'Eng', companyId: 1 });
    });
  });
});