import { IsEmail, IsEnum, IsNotEmpty, MaxLength, MinLength } from "class-validator"
import { ROLE } from '../../generated/prisma/enums'
export class CreateUserDto {
    @IsNotEmpty()
    name:string
    @IsNotEmpty()
    @IsEmail()
    email:string
    @IsEnum(ROLE)
    role :ROLE
    @IsNotEmpty()
    @MinLength(8)
    password :string
}
