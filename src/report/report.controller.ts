import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { HiredEmployeesReportDto } from './dto/hired-employees-report.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('report')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('filters')
  @ApiOperation({
    summary: 'Report filter options',
    description:
      'Returns every company with its departments, used to fill the report filters. Requires a JWT and the Admin or Manager role.',
  })
  filters() {
    return this.reportService.filters();
  }

  @Get('hired-employees')
  @ApiOperation({
    summary: 'Hired employees report',
    description:
      'Returns the HIRED employees matching the company, department and hire date range filters, with days employed, summary totals and pagination details. Returns 10 employees per page; use page to select a page number. Requires a JWT and the Admin or Manager role.',
  })
  hiredEmployees(@Query() query: HiredEmployeesReportDto) {
    return this.reportService.hiredEmployees(query);
  }

  @Get('hired-employees/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="hired-employees-report.csv"')
  @ApiOperation({
    summary: 'Export the hired employees report',
    description:
      'Downloads every employee matching the same filters as the report (no pagination) as a CSV file that opens in Excel. Requires a JWT and the Admin or Manager role.',
  })
  exportHiredEmployees(@Query() query: HiredEmployeesReportDto) {
    return this.reportService.exportHiredEmployees(query);
  }
}
