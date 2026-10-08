import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { STATUS } from '../generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class EmployeeService {
  constructor(private prisma:PrismaService){}
  private readonly logger = new Logger(EmployeeService.name)
  private async assertDepartmentBelongsToCompany(departmentId: number,companyId?: number,){
    const dept = await this.prisma.department.findUnique({
      where:{
        id:departmentId
      },
      select:{
        companyId:true
      }
    })
    if (!dept) {
      this.logger.warn(`department ${departmentId} not found`);
      throw new NotFoundException('Department not found');
    }
    if (companyId !== undefined && dept.companyId !== companyId) {
      this.logger.warn(`department ${departmentId} does not belong to company ${companyId}`);
      throw new BadRequestException('Department does not belong to the selected company');
    }
  }
  async create(createEmployeeDto: CreateEmployeeDto) {
    this.logger.log('creating employee');
    const { companyId, ...data } = createEmployeeDto;
    await this.assertDepartmentBelongsToCompany(data.departmentId, companyId);
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: data.email },
    });
    if (existingEmployee) {
      this.logger.warn('employee with email already exists');
      throw new ConflictException('Employee with this email already exists');
    }
    const employee = await this.prisma.employee.create({
      data: { ...data, status: STATUS.APPLICATION_RECEIVED, hiredOn: null },
    });
    return {
      message: 'employee created successfully',
      data: { employee },
    };
  }

  async findAll(page: number = 1) {
    this.logger.log("fetching employees")
    const limit:number = 10;
    const skip = (page - 1) * limit;
    const [employees,total] = await Promise.all([ this.prisma.employee.findMany({
        skip,
        take:limit,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          address: true,
          departmentId: true,
          status: true,
          hiredOn: true,
          designation: true,
          department: {
            select: {
              name: true,
              companyId: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }), this.prisma.employee.count()]);
      const totalPages = Math.ceil(total / limit)
      const employeesWithDaysEmployed = employees.map((employee) => {
        const daysEmployed = employee.hiredOn ? Math.floor((Date.now() - employee.hiredOn.getTime()) /(1000 * 60 * 60 * 24),): null;
        return {...employee, daysEmployed}
      })
    return {
      message:"Employees fetched successfully",
      data:employeesWithDaysEmployed,
      pagination:{
        currentPage: page,
        limit,
        total,
        totalPages,
      }
    };
  }

  async findOne(id: number) {
    this.logger.log("fetching employee")
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        departmentId: true,
        status: true,
        hiredOn: true,
        designation: true,
        department: {
          select: {
            name: true,
            companyId: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!employee) {
      this.logger.warn(`employee with ${id} not found`)
      throw new NotFoundException('Employee not found');
    }
    const daysEmployed = employee.hiredOn ? Math.floor((Date.now() - employee.hiredOn.getTime()) /(1000 * 60 * 60 * 24),): null;
    return {
      message: 'Employee fetched successfully',
      data: {
        ...employee,
        daysEmployed,
      },
    };
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto){
    this.logger.log('updating employee');
    const { companyId, ...data } = updateEmployeeDto;
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      this.logger.warn(`Employee with ${id} not found`);
      throw new NotFoundException('Employee not found');
    }
    if (data.departmentId !== undefined || companyId !== undefined) {
      await this.assertDepartmentBelongsToCompany(
        data.departmentId ?? employee.departmentId,
        companyId,
      );
    }
    if (data.hiredOn && data.hiredOn > new Date()) {
      this.logger.warn(`Invalid hiredOn date for employee ${id}`);
      throw new BadRequestException('hiredOn cannot be a future date');
    }
    const finalStatus = data.status ?? employee.status;
    if (finalStatus !== STATUS.HIRED) {
      data.hiredOn = null;
    } else if (!data.hiredOn && !employee.hiredOn) {
      data.hiredOn = new Date();
    }
    if (data.email && data.email !== employee.email) {
      const existing = await this.prisma.employee.findUnique({ where: { email: data.email } });
      if (existing) {
        this.logger.warn(`employee with email already exists`);
        throw new ConflictException('Employee with this email already exists');
      }
    }
    const allowedTransitions:Record<STATUS,STATUS[]> = {
      [STATUS.APPLICATION_RECEIVED ]: [STATUS.INTERVIEW_SCHEDULED,STATUS.NOT_ACCEPTED],
      [STATUS.INTERVIEW_SCHEDULED]:[STATUS.NOT_ACCEPTED,STATUS.HIRED],
      [STATUS.HIRED]:[],
      [STATUS.NOT_ACCEPTED]:[]
    }
    if(data.status&&data.status!==employee.status){
      if(!allowedTransitions[employee.status].includes(data.status)){
        throw new BadRequestException(`Cannot change status from ${employee.status} to ${data.status}`);
      }
    }
    const newEmp = await this.prisma.employee.update({ where: { id }, data });
    return {
      message: 'Employee updated Successfully',
      data: { newEmp },
    };
  }

  async remove(id: number) {
    this.logger.log("deleting employee");
    const employee = await this.prisma.employee.findUnique({
      where:{id:id}
    })
    if(!employee){
      this.logger.warn(`Employee with ${id} not found`)
      throw new NotFoundException("Employee not found")
    }
    const deletedEmp = await this.prisma.employee.delete({
      where:{id:id}
    })
    return {
      message:"Employee deleted Successfully",
      data:{deletedEmp}
    }
  }
}