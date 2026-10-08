import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
  login(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.login(createAuthDto);
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
