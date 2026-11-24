import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const HIRE_DATE_RANGES = ['1m', '3m', '6m', '12m', 'all'] as const;
export type HireDateRange = (typeof HIRE_DATE_RANGES)[number];

// How many months back each range reaches ('all' = no lower bound)
export const RANGE_MONTHS: Record<Exclude<HireDateRange, 'all'>, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '12m': 12,
};

export class HiredEmployeesReportDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Only employees of this company', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId?: number;

  @ApiPropertyOptional({ description: 'Only employees of this department', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({
    enum: HIRE_DATE_RANGES,
    default: '12m',
    description: 'Hire date range, counted back from today',
  })
  @IsOptional()
  @IsIn(HIRE_DATE_RANGES)
  range: HireDateRange = '12m';

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Free text matched against name, email, position, company and department',
    example: 'ahmed',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
