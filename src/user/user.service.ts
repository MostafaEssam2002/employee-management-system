import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private prisma:PrismaService){}
  async findAll(page: number = 1) {
    this.logger.log("fetching users")
    const limit = 10;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
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
    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    return {
      message:"user fetched successfully",
      data:user
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    this.logger.log(`Fetching user with ID: ${id}`);
    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    const newUser = await this.prisma.user.update({where:{id:id},data:updateUserDto})
    return {
      message:"user updated successfully",
      data:newUser
    };
  }

  async remove(id: number) {
    this.logger.log(`Fetching user with ID: ${id}`);

    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      this.logger.warn(`user with ${id} not found`);
      throw new NotFoundException("User not found")
    }
    const newUser = await this.prisma.user.delete({where:{id:id}})
    return {
      message:"user deleted successfully",
      data:newUser
    };
  }
}
