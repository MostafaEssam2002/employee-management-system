import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateAuthDto {
    @IsEmail()
    @IsNotEmpty()
    email:string
    @IsNotEmpty()
    @MinLength(8)
    password:string
}
