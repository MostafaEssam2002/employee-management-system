import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from 'src/company/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an employee',
    description:
      'Creates an employee record. The department must belong to the specified company, and hiredOn is required when the status is HIRED. Requires a JWT and the Admin role.',
  })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List employees',
    description:
      'Returns employees with their department and company details, days employed, and pagination details. Returns 10 employees per page; use page to select a page number. Requires a JWT and the Admin role.',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.employeeService.findAll(Number(paginationDto.page));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an employee by ID',
    description:
      'Returns the employee details with department and company information and days employed. Requires a JWT and the Admin role.',
  })
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an employee',
    description:
      'Updates the specified employee. Validates that the department belongs to the company and that any employee status transition is allowed. Requires a JWT and the Admin role.',
  })
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(+id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an employee',
    description: 'Deletes the employee record specified by ID. Requires a JWT and the Admin role.',
  })
  remove(@Param('id') id: string) {
    return this.employeeService.remove(+id);
  }
}