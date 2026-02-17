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

        // Use Origin header to pick the correct cookie for each app
        const dashboardUrl =
            process.env.DASHBOARD_URL || 'http://localhost:5174';
        const origin = req.headers?.origin || '';

        if (origin === dashboardUrl) {
            // Dashboard request: prefer dashboard cookie
            return req.cookies[dashboardCookieName] || req.cookies[frontendCookieName] || null;
        }

        // Frontend/other request: prefer frontend cookie
        return req.cookies[frontendCookieName] || req.cookies[dashboardCookieName] || null;
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
