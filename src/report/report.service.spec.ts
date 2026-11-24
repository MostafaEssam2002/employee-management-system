import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from 'src/prisma/prisma.service';

const DAY_MS = 1000 * 60 * 60 * 24;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

const employee = (id: number, hiredOn: Date, overrides = {}) => ({
  id,
  name: `Employee ${id}`,
  email: `e${id}@mail.com`,
  mobile: '01012345678',
  designation: 'Engineer',
  hiredOn,
  departmentId: 1,
  department: {
    id: 1,
    name: 'Development',
    companyId: 1,
    company: { id: 1, name: 'Tech Solutions' },
  },
  ...overrides,
});

describe('ReportService', () => {
  let service: ReportService;
  const prisma = {
    employee: { findMany: jest.fn(), count: jest.fn() },
    company: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('only reports HIRED employees and applies the filters', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);

    await service.hiredEmployees({ page: 2, companyId: 3, departmentId: 5, range: '6m' });

    const args = prisma.employee.findMany.mock.calls[0][0];
    expect(args.where.status).toBe('HIRED');
    expect(args.where.departmentId).toBe(5);
    expect(args.where.department).toEqual({ companyId: 3 });
    expect(args.where.hiredOn.not).toBeNull();
    expect(args.where.hiredOn.gte).toBeInstanceOf(Date);
    expect(args.skip).toBe(10);
    expect(args.take).toBe(10);
  });

  it('searches name, email, position, department and company', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);

    await service.hiredEmployees({ page: 1, range: 'all', search: 'ahmed' });

    const { OR } = prisma.employee.findMany.mock.calls[0][0].where;
    expect(OR).toHaveLength(5);
    expect(OR[0]).toEqual({ name: { contains: 'ahmed' } });
    expect(OR[4]).toEqual({ department: { company: { name: { contains: 'ahmed' } } } });
  });

  it('adds no search condition when the search is blank', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);

    await service.hiredEmployees({ page: 1, range: 'all', search: '   ' });

    expect(prisma.employee.findMany.mock.calls[0][0].where.OR).toBeUndefined();
  });

  it('has no lower date bound for the "all" range', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);

    await service.hiredEmployees({ page: 1, range: 'all' });

    expect(prisma.employee.findMany.mock.calls[0][0].where.hiredOn).toEqual({ not: null });
  });

  it('computes days employed, summary totals and pagination', async () => {
    const page = [employee(1, daysAgo(100)), employee(2, daysAgo(50))];
    const all = [
      { hiredOn: daysAgo(100), departmentId: 1, department: { companyId: 1 } },
      { hiredOn: daysAgo(50), departmentId: 2, department: { companyId: 2 } },
      { hiredOn: daysAgo(30), departmentId: 2, department: { companyId: 2 } },
    ];
    prisma.employee.findMany.mockResolvedValueOnce(page).mockResolvedValueOnce(all);
    prisma.employee.count.mockResolvedValue(23);

    const res = await service.hiredEmployees({ page: 1, range: '12m' });

    expect(res.data[0]).toMatchObject({ id: 1, daysEmployed: 100, company: 'Tech Solutions', department: 'Development' });
    expect(res.summary.totalCompanies).toBe(2);
    expect(res.summary.totalDepartments).toBe(2);
    expect(res.summary.hiredEmployees).toBe(23);
    expect(res.summary.totalDaysEmployed).toBe(180);
    expect(res.summary.averageYears).toBe(Math.round((180 / 23 / 365) * 100) / 100);
    expect(res.pagination).toEqual({ currentPage: 1, limit: 10, total: 23, totalPages: 3 });
  });

  it('returns zeros when nobody matches', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);

    const res = await service.hiredEmployees({ page: 1, range: '1m' });

    expect(res.summary).toEqual({
      totalCompanies: 0,
      totalDepartments: 0,
      hiredEmployees: 0,
      totalDaysEmployed: 0,
      averageYears: 0,
    });
    expect(res.pagination.totalPages).toBe(0);
  });

  it('exports a UTF-8 CSV with a header row, escaping quotes and formulas', async () => {
    prisma.employee.findMany.mockResolvedValue([
      employee(1, new Date('2026-01-15T00:00:00Z'), { name: '=HYPERLINK("x")' }),
    ]);

    const csv = await service.exportHiredEmployees({ page: 1, range: 'all' });
    const [header, row] = csv.split('\r\n');

    expect(csv.startsWith('﻿')).toBe(true);
    expect(header).toContain('"Employee Name"');
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain('"2026-01-15"');
  });
});
