import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '@shared/interfaces';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // TODO IF NEED
    }

    getAccessToken(payload: IJwtPayload, rememberMe?: boolean) {
        const expiresIn = rememberMe
            ? this.configService.get<string>('authTokenExpiredTimeRememberMe')
            : this.configService.get<string>('authTokenExpiredTime');

        return this.jwtService.sign(
            { ...payload },
            {
                expiresIn: (expiresIn || '24h') as any,
            },
        );
    }

    getRefreshToken(payload: IJwtPayload) {
        const refreshExpiresIn = this.configService.get<string>(
            'authRefreshTokenExpiredTime',
        );

        return this.jwtService.sign(
            { ...payload },
            {
                expiresIn: (refreshExpiresIn || '7d') as any,
            },
        );
    }

    decodeToken(token: string) {
        const user: { id: number; name: string } =
            this.jwtService.decode(token);
        return user;
    }

    verifyToken(token: string): boolean {
        try {
            this.jwtService.verify(token);
            return true;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token has expired');
            } else {
                throw new UnauthorizedException('Invalid token');
            }
        }
    }
}
