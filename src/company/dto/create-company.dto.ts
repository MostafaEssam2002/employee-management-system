import { IsNotEmpty, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.trim())
    name: string;
}
 