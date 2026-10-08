import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email:string

    @ApiProperty({ minLength: 8, example: 'password123' })
    @IsNotEmpty()
    @MinLength(8)
    password:string
}
