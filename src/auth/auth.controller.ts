import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Log in',
    description:
      'Validates the email and password, then returns the user details and a JWT access token for protected endpoints.',
  })
  async login(@Body() createAuthDto: CreateAuthDto , @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(createAuthDto);
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the Employee role. Other roles are not allowed through this endpoint, and an email that is already registered is rejected.',
  })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto)//register(createUserDto);
  }
}
