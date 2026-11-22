import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma:PrismaService ){}
  private readonly logger = new Logger(DashboardService.name);  
  async findAll() {
    const now = new Date();
    // Current month start
    const currentStart = new Date(now.getFullYear(),now.getMonth(),1,);
    // Previous month start
    const previousStart = new Date(now.getFullYear(),now.getMonth() - 1,1,);
    // Same day and time in previous month
    const lastDayOfPreviousMonth = new Date(now.getFullYear(),now.getMonth(),0,).getDate();
    const previousPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      Math.min(now.getDate(), lastDayOfPreviousMonth),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );

    // Date filters
    const currentPeriod = {
      gte: currentStart,
      lte: now,
    };

    const previousPeriod = {
      gte: previousStart,
      lte: previousPeriodEnd,
    };

    // Get all counts
    const [totalCompanies,totalDepartments,totalEmployees,totalHiredEmployees,companiesCurrent,companiesPrevious,departmentsCurrent,departmentsPrevious,employeesCurrent,employeesPrevious,hiredCurrent,hiredPrevious,numberOfApplicationRecievedEmployees,numberOfNotAcceptedEmployees,numberOfInterviewScheduledEmployees] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.department.count(),
      this.prisma.employee.count(),
      this.prisma.employee.count({
        where: { status: "HIRED" },
      }),
      this.prisma.company.count({
        where: { createdAt: currentPeriod },
      }),
      this.prisma.company.count({
        where: { createdAt: previousPeriod },
      }),
      this.prisma.department.count({
        where: { createdAt: currentPeriod },
      }),
      this.prisma.department.count({
        where: { createdAt: previousPeriod },
      }),
      this.prisma.employee.count({
        where: { createdAt: currentPeriod },
      }),
      this.prisma.employee.count({
        where: { createdAt: previousPeriod },
      }),
      this.prisma.employee.count({
        where: {
          status: "HIRED",
          createdAt: currentPeriod,
        },
      }),
      this.prisma.employee.count({
        where: {
          status: "HIRED",
          createdAt: previousPeriod,
        },
      }),
      this.prisma.employee.count({
        where: {
          status: "APPLICATION_RECEIVED",
        },
      }),
      this.prisma.employee.count({
        where: {
          status: "NOT_ACCEPTED",
        },
      }),
      this.prisma.employee.count({
        where: {
          status: "INTERVIEW_SCHEDULED",
        },
      }),
    ]);
    // Calculate difference
    const getGrowth = (current: number, previous: number) => ({current,previous,difference: current - previous,});
    return {
      numberOfCompanies: {
        total: totalCompanies,
        growth: getGrowth(companiesCurrent, companiesPrevious),
      },
      numberOfDepts: {
        total: totalDepartments,
        growth: getGrowth(departmentsCurrent, departmentsPrevious),
      },
      numberOfEmployees: {
        total: totalEmployees,
        growth: getGrowth(employeesCurrent, employeesPrevious),
      },
      numberOfHiredEmployees: {
        total: totalHiredEmployees,
        growth: getGrowth(hiredCurrent, hiredPrevious),
      },
      numberOfApplicationRecievedEmployees,
      numberOfInterviewScheduledEmployees,
      numberOfNotAcceptedEmployees
    };
  }
  // create(createDashboardDto: CreateDashboardDto) {
  //   return 'This action adds a new dashboard';
  // }


  // findOne(id: number) {
  //   return `This action returns a #${id} dashboard`;
  // }

  // update(id: number, updateDashboardDto: UpdateDashboardDto) {
  //   return `This action updates a #${id} dashboard`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} dashboard`;
  // }
}
