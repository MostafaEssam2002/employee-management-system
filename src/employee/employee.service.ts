import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma:PrismaService){}
  private readonly logger = new Logger(EmployeeService.name)
  async create(createEmployeeDto: CreateEmployeeDto) {
    this.logger.log("creating employee")
    const deptID:number = createEmployeeDto.departmentId
    const dept = await this.prisma.department.findUnique({
      where:{id:deptID}
    })
    if(!dept){
      this.logger.warn("department not found")
      throw new NotFoundException("department not found")
    }
    const employee = await this.prisma.employee.create({
      data:createEmployeeDto
    })
    return {
      message:"employee created successfully",
      data:{employee}
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
      }), this.prisma.department.count()]);
      const totalPages = Math.ceil(total / limit)
    return {
      message:"Employees fetched successfully",
      data:employees,
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
  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    this.logger.log("updating employee")
    const employee = await this.prisma.employee.findUnique({
      where:{id:id}
    })
    if(!employee){
      this.logger.warn(`Employee with ${id} not found`)
      throw new NotFoundException("Employee not found")
    }
    const newEmp = await this.prisma.employee.update({
      where:{id:id},
      data:updateEmployeeDto
    })
    return {
      message:"Employee updated Successfully",
      data:{newEmp}
    } 
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
