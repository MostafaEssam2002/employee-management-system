import { IsNotEmpty, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Acme Corporation' })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.trim())
    name: string;
}
 