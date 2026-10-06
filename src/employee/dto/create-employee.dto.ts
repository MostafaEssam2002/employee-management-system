import { IsDateString, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { STATUS } from '../../generated/prisma/enums';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber()
    mobile: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsInt()
    departmentId: number;

    @IsNotEmpty()
    @IsEnum(STATUS)
    status: STATUS;

    @IsOptional()
    @IsDateString()
    hiredOn?: string;

    @IsString()
    @IsNotEmpty()
    designation: string;
}