jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CompanyService', () => {
  let service: CompanyService;

  const prisma = {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CompanyService);
  });

  // ---------------------------------------------------------------- create
  describe('create', () => {
    it('creates the company with its name only', async () => {
      prisma.company.create.mockResolvedValue({ id: 1, name: 'Acme' });

      const result = await service.create({ name: 'Acme' });

      expect(prisma.company.create).toHaveBeenCalledWith({ data: { name: 'Acme' } });
      expect(result.message).toBe('Company Created Successfully');
      expect(result.data).toEqual({ id: 1, name: 'Acme' });
    });
  });

  // --------------------------------------------------------------- findAll
  describe('findAll', () => {
    const companiesPage = [
      { id: 1, name: 'Acme', _count: { departments: 2 } },
      { id: 2, name: 'Globex', _count: { departments: 0 } },
      { id: 3, name: 'Initech', _count: { departments: 1 } },
    ];
    const departmentsOfPage = [
      { companyId: 1, _count: { employees: 3 } },
      { companyId: 1, _count: { employees: 2 } },
      { companyId: 3, _count: { employees: 4 } },
    ];

    beforeEach(() => {
      prisma.company.findMany.mockResolvedValue(companiesPage);
      prisma.company.count.mockResolvedValue(25);
      prisma.department.findMany.mockResolvedValue(departmentsOfPage);
    });

    it('paginates and orders by id', async () => {
      await service.findAll(3, 10);

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10, orderBy: { id: 'asc' } }),
      );
    });

    it('returns numberOfDepartments from the department count', async () => {
      const result = await service.findAll(1, 10);

      expect(result.data.map((c) => c.numberOfDepartments)).toEqual([2, 0, 1]);
    });

    it('sums the employees of all departments of each company', async () => {
      const result = await service.findAll(1, 10);

      // company 1: 3 + 2, company 2: no departments, company 3: 4
      expect(result.data.map((c) => c.numberOfEmployees)).toEqual([5, 0, 4]);
    });

    it('returns id and name for every company', async () => {
      const result = await service.findAll(1, 10);

      expect(result.data[0]).toEqual({
        id: 1,
        name: 'Acme',
        numberOfDepartments: 2,
        numberOfEmployees: 5,
      });
    });

    it('counts employees only for the companies on the current page', async () => {
      await service.findAll(1, 10);

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: { in: [1, 2, 3] } } }),
      );
    });

    it('computes the pagination details', async () => {
      const result = await service.findAll(2, 10);

      expect(result.pagination).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    });

    it('returns an empty list for an empty page', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);
      prisma.company.count.mockResolvedValue(0);

      const result = await service.findAll(1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // --------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      prisma.employee.count.mockResolvedValue(0);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('returns the name with the number of departments and employees', async () => {
      prisma.company.findUnique.mockResolvedValue({
        name: 'Acme',
        _count: { departments: 3 },
      });
      prisma.employee.count.mockResolvedValue(12);

      const result = await service.findOne(1);

      expect(result.message).toBe('Company fetched successfully');
      expect(result.data).toEqual({
        name: 'Acme',
        numberOfDepartments: 3,
        numberOfEmployees: 12,
      });
    });

    it('counts the employees through the departments of the company', async () => {
      prisma.company.findUnique.mockResolvedValue({
        name: 'Acme',
        _count: { departments: 3 },
      });
      prisma.employee.count.mockResolvedValue(0);

      await service.findOne(7);

      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { department: { companyId: 7 } },
      });
    });
  });

  // ---------------------------------------------------------------- update
  describe('update', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { name: 'New' })).rejects.toThrow(NotFoundException);
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it('updates the name and returns the updated company', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Old' });
      prisma.company.update.mockResolvedValue({ id: 1, name: 'New' });

      const result = await service.update(1, { name: 'New' });

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New' },
      });
      expect(result.data).toEqual({ id: 1, name: 'New' });
    });
  });

  // ---------------------------------------------------------------- remove
  describe('remove', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it('deletes the company and returns it', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 1, name: 'Acme' });
      prisma.company.delete.mockResolvedValue({ id: 1, name: 'Acme' });

      const result = await service.remove(1);

      expect(prisma.company.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.data).toEqual({ id: 1, name: 'Acme' });
    });
  });
});