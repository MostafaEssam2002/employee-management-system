import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDepartmentDto {
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.trim())
    name:string;
    @IsNumber()
    @IsNotEmpty()
    companyId:number
}
