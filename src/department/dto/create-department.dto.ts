import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ example: 'Engineering' })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.trim())
    name:string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    companyId:number
}
