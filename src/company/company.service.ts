import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    this.logger.log('Creating company');
    const company = await this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
      },
    });
    return {
      message: 'Company Created Successfully',
      data: company,
    };
  }

  async findAll(page: number, limit: number) {
    this.logger.log(`Fetching companies (page ${page}, limit ${limit})`);
    const skip = (page - 1) * limit;
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          _count: { select: { departments: true } },
        },
      }),
      this.prisma.company.count(),
    ]);

    // Employees of every company on this page, counted with a single query
    const departments = await this.prisma.department.findMany({
      where: { companyId: { in: companies.map((c) => c.id) } },
      select: {
        companyId: true,
        _count: { select: { employees: true } },
      },
    });

    const employeesByCompany = new Map<number, number>();
    for (const department of departments) {
      employeesByCompany.set(
        department.companyId,
        (employeesByCompany.get(department.companyId) ?? 0) +
          department._count.employees,
      );
    }

    return {
      data: companies.map((company) => ({
        id: company.id,
        name: company.name,
        numberOfDepartments: company._count.departments,
        numberOfEmployees: employeesByCompany.get(company.id) ?? 0,
      })),
      message: 'Companies retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    this.logger.log(`Fetching company with ID: ${id}`);
    const [company, numberOfEmployees] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id },
        select: {
          name: true,
          _count: { select: { departments: true } },
        },
      }),
      this.prisma.employee.count({
        where: { department: { companyId: id } },
      }),
    ]);

    if (!company) {
      this.logger.warn(`Company with id ${id} not found`);
      throw new NotFoundException('Company not found');
    }

    return {
      data: {
        name: company.name,
        numberOfDepartments: company._count.departments,
        numberOfEmployees,
      },
      message: 'Company fetched successfully',
    };
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    this.logger.log(`Updating company with ID: ${id}`);
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      this.logger.warn(`Company with id ${id} not found for update`);
      throw new NotFoundException('Company not found');
    }
    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: {
        name: updateCompanyDto.name,
      },
    });
    return {
      message: 'Company updated successfully',
      data: updatedCompany,
    };
  }

  async remove(id: number) {
    this.logger.log(`Deleting company with ID: ${id}`);
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      this.logger.warn(`Company with id ${id} not found for deletion`);
      throw new NotFoundException('Company not found');
    }
    // Its departments and their employees are removed by the database (ON DELETE CASCADE)
    const deletedCompany = await this.prisma.company.delete({ where: { id } });
    return {
      message: 'Company deleted successfully',
      data: deletedCompany,
    };
  }
}
  // async findOne(id: number) {
//   const rows = await this.prisma.$queryRaw<
//     { name: string; numberOfDepartments: bigint; numberOfEmployees: bigint }[]
//   >`
//     SELECT
//       company.name AS name,
//       COUNT(DISTINCT department.id) AS numberOfDepartments,
//       COUNT(employee.id) AS numberOfEmployees
//     FROM company
//       LEFT JOIN department ON department.companyId = company.id
//       LEFT JOIN employee ON employee.departmentId = department.id
//     WHERE company.id = ${id}
//     GROUP BY company.id
//   `;

//   if (rows.length === 0) {
//     throw new NotFoundException('Company not found');
//   }

//   const company = rows[0];

//   return {
//     data: {
//       name: company.name,
//       numberOfDepartments: Number(company.numberOfDepartments),
//       numberOfEmployees: Number(company.numberOfEmployees),
//     },
//     message: 'Company fetched successfully',
//   };
// }
// async findOne(id: number) {
//     const company = await this.prisma.company.findUnique({
//       where: {
//         id: id,
//       },
//       select: {
//         name: true,
//         _count: {
//           select: {
//             departments: true,
//           },
//         },
//         departments: {
//           select: {
//             name: true,
//             _count: {
//               select: {
//                 employees: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!company) {
//       throw new NotFoundException('Company not found');
//     }

//     return {
//       data: {
//         name: company.name,
//         numberOfDepartments: company._count.departments,
//         numberOfEmployees: company.departments.reduce(
//           (acc, department) => acc + department._count.employees,
//           0,
//         ),
//       },
//       message: 'Company fetched successfully',
//     };
//   }  
  //   async findAll(page: number, limit: number) {
//   const skip = (page - 1) * limit;

//   const [companies, total] = await Promise.all([
//     this.prisma.$queryRaw<
//       {
//         id: number;
//         name: string;
//         numberOfDepartments: bigint;
//         numberOfEmployees: bigint;
//       }[]
//     >`
//       SELECT
//         company.id AS id,
//         company.name AS name,
//         COUNT(DISTINCT department.id) AS numberOfDepartments,
//         COUNT(employee.id) AS numberOfEmployees
//       FROM company
//         LEFT JOIN department ON department.companyId = company.id
//         LEFT JOIN employee ON employee.departmentId = department.id
//       GROUP BY company.id
//       ORDER BY company.id
//       LIMIT ${limit} OFFSET ${skip}
//     `,
//     this.prisma.company.count(),
//   ]);

//   return {
//     data: companies.map((company) => ({
//       id: company.id,
//       name: company.name,
//       numberOfDepartments: Number(company.numberOfDepartments),
//       numberOfEmployees: Number(company.numberOfEmployees),
//     })),
//     message: 'Companies retrieved successfully',
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// }