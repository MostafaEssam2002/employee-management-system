import { IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { STATUS } from '../../generated/prisma/enums';
import { Type } from 'class-transformer';export class CreateEmployeeDto {
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
    @IsDate()
    @Type(() => Date)
    hiredOn?: Date|null;

    @IsString()
    @IsNotEmpty()
    designation: string;
    @IsNotEmpty()
    @IsInt()
    companyId:number ;
}