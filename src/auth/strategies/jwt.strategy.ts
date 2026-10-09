import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
        });

        if (!user) {
        this.logger.warn(`Token rejected: user ${payload.sub} no longer exists`);
        throw new UnauthorizedException('Invalid or expired token');
        }

        if (user.role !== payload.role) {
        this.logger.warn(`Token rejected: role changed for user ${user.id}`);
        throw new UnauthorizedException('Invalid or expired token');
        }

        return { sub: user.id, email: user.email, role: user.role };
    }
}