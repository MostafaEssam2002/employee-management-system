import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Roles } from 'src/auth/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiTags('Companies')
@ApiBearerAuth('JWT-auth')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a company',
    description: 'Creates a company with the supplied name. Requires a JWT and the Admin role.',
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List companies',
    description:
      'Returns companies ordered by ID, including department and employee counts, and pagination details. Returns 10 companies per page; use page to select a page number. Requires a JWT and the Admin role.',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.companyService.findAll(paginationDto.page, 10);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a company by ID',
    description:
      'Returns the company name and its department and employee counts. Requires a JWT and the Admin role.',
  })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a company',
    description:
      'Updates the specified company with the supplied fields. Requires a JWT and the Admin role.',
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(+id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a company',
    description: 'Deletes the company specified by ID. Requires a JWT and the Admin role.',
  })
  remove(@Param('id') id: string) {
    return this.companyService.remove(+id);
  }
}
