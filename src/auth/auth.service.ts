import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(private prisma:PrismaService,  private jwtService: JwtService){}
  async login(createAuthDto: CreateAuthDto) {
    const user = await this.prisma.user.findUnique({where:{email:createAuthDto.email}})
    if(!user){
      throw new UnauthorizedException("Invalid user credentials");
    }
    if(! await bcrypt.compare(createAuthDto.password,user.password)){
      throw new UnauthorizedException("Invalid user credentials");
    }
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = await this.jwtService.signAsync(payload);
    return {
      message:"login Successfully",
      data:{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token:accessToken
    };
  }
  async register(createUserDto: CreateUserDto) {
    const fetchedUser = await this.prisma.user.findUnique({where:{email:createUserDto.email},select:{email:true}})
    if(fetchedUser){
      throw new ConflictException('Email already exists')
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword
    const user = await this.prisma.user.create({
      data:createUserDto
    })
    return {
      message:"User created successfully",
      data:user
    };
  }
}
