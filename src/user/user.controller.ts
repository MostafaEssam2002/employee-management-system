import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/company/dto/pagination.dto';
import { AuthService } from './../auth/auth.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@Controller('user')
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService,private readonly authService:AuthService ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Creates a user account with the specified role and rejects duplicate email addresses. Requires a JWT and the Admin role.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'Returns users and pagination details without passwords. Returns 10 users per page; use page to select a page number. Requires a JWT and the Admin role.',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(Number(paginationDto.page));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by ID',
    description:
      'Returns the specified user details without the password. Requires a JWT and the Admin role.',
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Updates the specified user. If a new password is supplied, it is hashed before storage. Requires a JWT and the Admin role.',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Deletes the specified user and returns its details without the password. Requires a JWT and the Admin role.',
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}