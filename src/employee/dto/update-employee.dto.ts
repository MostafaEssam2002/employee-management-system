import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { STATUS } from 'src/generated/prisma/enums';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
    @ApiPropertyOptional({ enum: STATUS })
    @IsOptional()
    @IsEnum(STATUS)
    status?: STATUS;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    hiredOn?: Date | null;
}