import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_MS, authCookieOptions } from './auth.constants';
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
    response.cookie(AUTH_COOKIE_NAME, result.token, {
      ...authCookieOptions(),
      maxAge: SESSION_MAX_AGE_MS,
    });
    return {
      message: result.message,
      // expiresAt (epoch ms) lets the client know when the session cookie dies
      data: { ...result.data, expiresAt: Date.now() + SESSION_MAX_AGE_MS },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out',
    description:
      'Clears the session cookie. Intentionally has no auth guard so it still works when the session has already expired.',
  })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
    return { message: 'Logged out successfully' };
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
