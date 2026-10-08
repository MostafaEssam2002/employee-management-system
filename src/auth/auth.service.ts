import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ROLE } from 'src/generated/prisma/enums';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private prisma:PrismaService,  private jwtService: JwtService){}
  
  async login(createAuthDto: CreateAuthDto) {
    const user = await this.prisma.user.findUnique({where:{email:createAuthDto.email}})
    if (!user) {
      this.logger.warn('Failed login: unknown account');
      throw new UnauthorizedException('Invalid user credentials');
    }

    const passwordMatches = await bcrypt.compare(createAuthDto.password, user.password);
    if (!passwordMatches) {
      this.logger.warn(`Failed login: wrong password for user ${user.id}`);
      throw new UnauthorizedException('Invalid user credentials');
    }

    this.logger.log(`User ${user.id} logged in`);
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
      this.logger.warn('Email already exists')
      throw new ConflictException('Email already exists');
    }
    if (data.role !== ROLE.Employee) {
      this.logger.warn('Invalid role for registration')
      throw new BadRequestException('Invalid role for registration');
    }
    data.password = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { ...data, role: ROLE.Employee },
    });
    this.logger.log(`User ${user.id} registered`);
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User created successfully',
      data: userWithoutPassword,
    };
  }
}
