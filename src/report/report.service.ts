import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { STATUS } from '../generated/prisma/enums';
import {
  HiredEmployeesReportDto,
  RANGE_MONTHS,
} from './dto/hired-employees-report.dto';

const DAY_MS = 1000 * 60 * 60 * 24;
const PAGE_SIZE = 10;

const CSV_HEADERS = [
  '#',
  'Employee Name',
  'Email Address',
  'Mobile Number',
  'Position',
  'Hired On',
  'Days Employed',
  'Company',
  'Department',
];

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(ReportService.name);

  private daysSince(date: Date, now = new Date()) {
    return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
  }

  // Only HIRED employees belong in this report, narrowed by the chosen filters
  private buildWhere(dto: HiredEmployeesReportDto): Prisma.EmployeeWhereInput {
    const hiredOn: Prisma.DateTimeNullableFilter = { not: null };
    if (dto.range !== 'all') {
      const since = new Date();
      since.setMonth(since.getMonth() - RANGE_MONTHS[dto.range]);
      hiredOn.gte = since;
    }

    // text search across the columns shown in the report
    const search = dto.search?.trim();
    const matchesSearch: Prisma.EmployeeWhereInput[] = search
      ? [
          { name: { contains: search } },
          { email: { contains: search } },
          { designation: { contains: search } },
          { department: { name: { contains: search } } },
          { department: { company: { name: { contains: search } } } },
        ]
      : [];

    return {
      status: STATUS.HIRED,
      hiredOn,
      ...(matchesSearch.length > 0 && { OR: matchesSearch }),
      ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
      ...(dto.companyId !== undefined && {
        department: { companyId: dto.companyId },
      }),
    };
  }

  private readonly rowSelect = {
    id: true,
    name: true,
    email: true,
    mobile: true,
    designation: true,
    hiredOn: true,
    department: {
      select: {
        id: true,
        name: true,
        company: { select: { id: true, name: true } },
      },
    },
  } satisfies Prisma.EmployeeSelect;

  private toRow(
    employee: Prisma.EmployeeGetPayload<{ select: ReportService['rowSelect'] }>,
    now: Date,
  ) {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      designation: employee.designation,
      hiredOn: employee.hiredOn,
      daysEmployed: employee.hiredOn ? this.daysSince(employee.hiredOn, now) : null,
      company: employee.department.company.name,
      department: employee.department.name,
    };
  }

  async hiredEmployees(dto: HiredEmployeesReportDto) {
    this.logger.log('building hired employees report');
    const where = this.buildWhere(dto);
    const skip = (dto.page - 1) * PAGE_SIZE;
    const now = new Date();

    const [employees, total, forStats] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: [{ hiredOn: 'desc' }, { id: 'asc' }],
        select: this.rowSelect,
      }),
      this.prisma.employee.count({ where }),
      // the summary cards cover EVERY matching employee, not only the current page
      this.prisma.employee.findMany({
        where,
        select: {
          hiredOn: true,
          departmentId: true,
          department: { select: { companyId: true } },
        },
      }),
    ]);

    const companies = new Set<number>();
    const departments = new Set<number>();
    let totalDaysEmployed = 0;
    for (const e of forStats) {
      companies.add(e.department.companyId);
      departments.add(e.departmentId);
      if (e.hiredOn) totalDaysEmployed += this.daysSince(e.hiredOn, now);
    }
    const averageYears = total ? totalDaysEmployed / total / 365 : 0;

    return {
      message: 'Hired employees report fetched successfully',
      data: employees.map((e) => this.toRow(e, now)),
      summary: {
        totalCompanies: companies.size,
        totalDepartments: departments.size,
        hiredEmployees: total,
        totalDaysEmployed,
        averageYears: Math.round(averageYears * 100) / 100,
      },
      pagination: {
        currentPage: dto.page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      generatedAt: now.toISOString(),
    };
  }

  // Companies with their departments, to fill the two filter dropdowns
  async filters() {
    const companies = await this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        departments: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });
    return { message: 'Report filters fetched successfully', data: { companies } };
  }

  // Spreadsheet cells that start with = + - @ would run as formulas in Excel
  private csvCell(value: unknown) {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  // Same filters as the report, every matching row (no pagination), as CSV that Excel opens
  async exportHiredEmployees(dto: HiredEmployeesReportDto) {
    this.logger.log('exporting hired employees report');
    const now = new Date();
    const employees = await this.prisma.employee.findMany({
      where: this.buildWhere(dto),
      orderBy: [{ hiredOn: 'desc' }, { id: 'asc' }],
      select: this.rowSelect,
    });

    const lines = employees.map((e, index) => {
      const row = this.toRow(e, now);
      return [
        index + 1,
        row.name,
        row.email,
        row.mobile,
        row.designation,
        row.hiredOn ? row.hiredOn.toISOString().slice(0, 10) : '',
        row.daysEmployed,
        row.company,
        row.department,
      ]
        .map((cell) => this.csvCell(cell))
        .join(',');
    });

    // BOM so Excel reads the file as UTF-8 (Arabic names stay intact)
    return '﻿' + [CSV_HEADERS.map((h) => this.csvCell(h)).join(','), ...lines].join('\r\n');
  }
}
