import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envConfigService } from '../../config/env-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                JwtStrategy.extractJWTFromCookie,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,
        });
    }

    private static extractJWTFromCookie(
        this: void,
        req: Request,
    ): string | null {
        if (!req.cookies) return null;

        const authConfig = envConfigService.getAuthJWTConfig();
        const frontendCookieName =
            authConfig.AUTH_TOKEN_COOKIE_NAME || 'accessToken';
        const dashboardCookieName =
            authConfig.AUTH_DASHBOARD_TOKEN_COOKIE_NAME ||
            'dashboardAccessToken';

        // Check both cookie names — frontend and dashboard
        if (req.cookies[frontendCookieName]) {
            return req.cookies[frontendCookieName];
        }
        if (req.cookies[dashboardCookieName]) {
            return req.cookies[dashboardCookieName];
        }

        return null;
    }

    validate(payload: any) {
        if (!payload.id || !payload.email) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return {
            id: payload.id || payload.sub,
            email: payload.email,
            role: payload.role,
            fullName: payload.fullName,
            isActive: payload.isActive,
        };
    }
}
