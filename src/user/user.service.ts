import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from "bcrypt"
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private prisma:PrismaService){}
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
  async findAll(page: number = 1) {
    this.logger.log("fetching users")
    const limit = 10;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select:{id:true,name:true,email:true,role:true},
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    this.logger.log(`Fetching user with ID: ${id}`);
    const user = await this.prisma.user.findUnique({where:{id:id},select:{id:true,name:true,email:true,role:true}});
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    return {
      message:"user fetched successfully",
      data:user
    };
  }

  // currentUserId = the admin making the request (from the JWT); used for the self-protection rules
  async update(id: number, updateUserDto: UpdateUserDto, currentUserId?: number) {
    this.logger.log(`Fetching user with ID: ${id}`);
    const data = { ...updateUserDto }
    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    if (currentUserId === id && data.role && data.role !== user.role) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (data.email && data.email !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }
    }
    if(data.password){
      const hashedPassword = await bcrypt.hash(data.password,10)
      data.password = hashedPassword;
    }
    const newUser = await this.prisma.user.update({where:{id:id},data:data})
    const { password, ...userWithoutPassword } = newUser;
    return {
      message:"user updated successfully",
      data:userWithoutPassword
    };
  }

  async remove(id: number, currentUserId?: number) {
    if (currentUserId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    this.logger.log(`Fetching user with ID: ${id}`);

    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    const deletedUser = await this.prisma.user.delete({where:{id:id}})
    const { password, ...userWithoutPassword } = deletedUser;
    return {
      message:"user deleted successfully",
      data:userWithoutPassword
    };
  }
}
