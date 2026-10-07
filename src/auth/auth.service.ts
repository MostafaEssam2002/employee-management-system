import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ROLE } from 'src/generated/prisma/enums';
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
    const data = { ...createUserDto };
    const fetchedUser = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        email: true,
      },
    });
    if (fetchedUser) {
      throw new ConflictException('Email already exists');
    }
    if (data.role !== ROLE.Employee) {
      throw new BadRequestException('Invalid role for registration');
    }
    data.password = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data,
    });
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User created successfully',
      data: userWithoutPassword,
    };
  }
}
