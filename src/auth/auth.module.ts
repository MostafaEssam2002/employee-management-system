import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './strategies/jwt.strategy';
import { SESSION_MAX_AGE_SECONDS } from './auth.constants';
@Module({
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
  exports: [AuthService],
  imports:[
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: SESSION_MAX_AGE_SECONDS,
        },
      }),
    }),
  ]
})
export class AuthModule {}
