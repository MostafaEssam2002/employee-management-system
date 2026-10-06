import { IsEmail, IsEnum, IsNotEmpty, MaxLength } from "class-validator"
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
    @MaxLength(10)
    password :string
}
