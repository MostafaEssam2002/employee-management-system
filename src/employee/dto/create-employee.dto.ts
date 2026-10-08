import { IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { STATUS } from '../../generated/prisma/enums';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
    @ApiProperty({ example: 'Alex Morgan' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'alex@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+12025550123' })
    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber()
    mobile: string;

    @ApiProperty({ example: '123 Main Street' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ example: 1 })
    @IsInt()
    departmentId: number;

    // @ApiProperty({ enum: STATUS })
    // @IsNotEmpty()
    // @IsEnum(STATUS)
    // status: STATUS;

    // @ApiPropertyOptional({ type: String, format: 'date-time' })
    // @IsOptional()
    // @IsDate()
    // @Type(() => Date)
    // hiredOn?: Date|null;

    @ApiProperty({ example: 'Software Engineer' })
    @IsString()
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    designation: string;

    @IsNotEmpty()
    @IsInt()
    companyId:number ;
}