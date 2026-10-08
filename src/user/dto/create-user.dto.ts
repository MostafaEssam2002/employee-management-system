import { IsEmail, IsEnum, IsNotEmpty, MaxLength, MinLength } from "class-validator"
import { ROLE } from '../../generated/prisma/enums'
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'Alex Morgan' })
    @IsNotEmpty()
    name:string

    @ApiProperty({ example: 'alex@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email:string

    @ApiProperty({ enum: ROLE })
    @IsEnum(ROLE)
    role :ROLE

    @ApiProperty({ minLength: 8, example: 'password123' })
    @IsNotEmpty()
    @MinLength(8)
    password :string
}
