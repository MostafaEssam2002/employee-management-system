// @nestjs/passport ships as ESM and can't be loaded by the current jest setup;
// the guard's behaviour isn't under test here, only the @Roles metadata + RolesGuard.
jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class {}, JwtModule: {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class {}, ConfigModule: {} }));
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { CompanyController } from 'src/company/company.controller';
import { DepartmentController } from 'src/department/department.controller';
import { EmployeeController } from 'src/employee/employee.controller';
import { UserController } from 'src/user/user.controller';
import { ReportController } from 'src/report/report.controller';
import { DashboardController } from 'src/dashboard/dashboard.controller';

type Role = 'Admin' | 'Manager' | 'Employee';
const A: Role = 'Admin';
const M: Role = 'Manager';
const E: Role = 'Employee';

// [controller, handler, roles allowed]
const MATRIX: [any, string, Role[]][] = [
  [DashboardController, 'findAll', [A, M, E]],

  [CompanyController, 'findAll', [A, M, E]],
  [CompanyController, 'findOne', [A, M, E]],
  [CompanyController, 'create', [A]],
  [CompanyController, 'update', [A]],
  [CompanyController, 'remove', [A]],

  [DepartmentController, 'findAll', [A, M, E]],
  [DepartmentController, 'findOne', [A, M]],
  [DepartmentController, 'create', [A, M]],
  [DepartmentController, 'update', [A, M]],
  [DepartmentController, 'remove', [A]],

  [EmployeeController, 'findAll', [A, M]],
  [EmployeeController, 'findOne', [A, M]],
  [EmployeeController, 'create', [A, M]],
  [EmployeeController, 'update', [A, M]],
  [EmployeeController, 'remove', [A]],

  [ReportController, 'hiredEmployees', [A, M]],
  [ReportController, 'filters', [A, M]],
  [ReportController, 'exportHiredEmployees', [A, M]],

  [UserController, 'findAll', [A]],
  [UserController, 'create', [A]],
  [UserController, 'update', [A]],
  [UserController, 'remove', [A]],
];

describe('Role access matrix', () => {
  const guard = new RolesGuard(new Reflector());
  const ctx = (controller: any, handler: string, role: Role) =>
    ({
      getHandler: () => controller.prototype[handler],
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as unknown as ExecutionContext;

  const roles: Role[] = [A, M, E];
  for (const [controller, handler, allowed] of MATRIX) {
    for (const role of roles) {
      const expected = allowed.includes(role);
      it(`${controller.name}.${handler} -> ${role} ${expected ? 'allowed' : 'forbidden (403)'}`, () => {
        const run = () => guard.canActivate(ctx(controller, handler, role));
        if (expected) expect(run()).toBe(true);
        else expect(run).toThrow('You do not have permission');
      });
    }
  }
});
