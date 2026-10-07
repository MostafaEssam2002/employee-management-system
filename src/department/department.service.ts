import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService){}
  private readonly logger = new Logger(DepartmentService.name);
  async create(createDepartmentDto: CreateDepartmentDto) {
    this.logger.log("createing department")
    const deptName =createDepartmentDto.name 
    const companyId =createDepartmentDto.companyId
    const company = await this.prisma.company.findUnique({
      where:{id:companyId}
    })
    if(!company){
      throw new NotFoundException ('Company not found'); 
    }
    const dept = await this.prisma.department.create({
      data:{
        name:deptName,
        companyId:companyId
      }
    })
    return {
      message:"department created successfully",
      data:dept
    }
  }

  async findAll(page: number = 1) {
    this.logger.log("fetching departments")
    const limit: number = 10;
    const skip = (page - 1) * limit;
    const [depts, total] = await Promise.all([
      this.prisma.department.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          company: {
            select: {
              name: true,
            },
          },
          _count:{
            select:{
              employees:true
            }
          }
        },
      }),
      this.prisma.department.count(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      message: 'departments fetched successfully',
      data: depts.map((dept) => ({
          id: dept.id,
          name: dept.name,
          company:dept.company.name,
          numberOfEmployees:dept._count.employees
        })
        ),
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    this.logger.log("fetching department")
    const dept = await this.prisma.department.findUnique({
      where:{id:id},
      select:{
        id:true,
        name:true,
        company:{
          select:{
            name:true
          }
        },
        _count:{
          select:{
            employees:true
          }
        }
      }
    })
    if(!dept){
      this.logger.warn(`department with ${id} not found`)
      throw new NotFoundException ('Department not found');
    }
    return {
      message:"department fetched successfully",
      data:{id:dept.id,name:dept.name,company:dept.company.name,numberOfEmployees:dept._count.employees}
    }
    // `This action returns a #${id} department`;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
  this.logger.log('updating department');

  const dept = await this.prisma.department.findUnique({
    where: { id },
  });

  if (!dept) {
    this.logger.warn(`department with ${id} not found`);
    throw new NotFoundException('Department not found');
  }

  if (updateDepartmentDto.companyId !== undefined) {
    const companyId = Number(updateDepartmentDto.companyId);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new BadRequestException('CompanyId must be a valid number');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    updateDepartmentDto.companyId = companyId;
  }

  const newDept = await this.prisma.department.update({
    where: { id },
    data: updateDepartmentDto,
  });

  return {
    message: 'Department updated successfully',
    data: newDept,
  };
}

  async remove(id: number) {
    this.logger.log("deleting department")
    const dept = await this.prisma.department.findUnique({
      where :{id:id}
    })
    if(!dept){
      this.logger.warn(`department with ${id} not found`)
      throw new NotFoundException ('Department not found');
    }
    const deleted = await this.prisma.department.delete({
      where:{id:id}
    })
    return {
      message:"department deleted successfully",
      data:deleted
    } 
  }
}
