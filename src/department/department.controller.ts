import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from 'src/company/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('department')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a department',
    description:
      'Creates a department and associates it with the company specified by companyId. Requires a JWT and the Admin role.',
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List departments',
    description:
      'Returns departments with their company names, employee counts, and pagination details. Returns 10 departments per page; use page to select a page number. Requires a JWT and the Admin role.',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.departmentService.findAll(Number(paginationDto.page));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a department by ID',
    description:
      'Returns the department details, its associated company name, and its employee count. Requires a JWT and the Admin role.',
  })
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a department',
    description:
      'Updates the specified department. The associated company can also be changed by supplying companyId. Requires a JWT and the Admin role.',
  })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a department',
    description: 'Deletes the department specified by ID. Requires a JWT and the Admin role.',
  })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(+id);
  }
}
