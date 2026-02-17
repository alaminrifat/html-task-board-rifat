import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class SetToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ||
            'http://localhost:5173';
        const isHttps = frontendUrl.startsWith('https://');

        const frontendCookieName =
            this.configService.get<string>('AUTH_TOKEN_COOKIE_NAME') ||
            'accessToken';
        const dashboardCookieName =
            this.configService.get<string>(
                'AUTH_DASHBOARD_TOKEN_COOKIE_NAME',
            ) || 'dashboardAccessToken';

        // Determine which app is making the request using the Origin header
        const dashboardUrl =
            this.configService.get<string>('DASHBOARD_URL') ||
            'http://localhost:5174';
        const origin = req.headers?.origin || '';
        const isDashboard =
            req.url?.includes('admin-login') ||
            origin === dashboardUrl;

        const cookieName = isDashboard
            ? dashboardCookieName
            : frontendCookieName;

        return next.handle().pipe(
            map((value) => {
                if (value.success && value.data?.token) {
                    res.cookie(cookieName, value.data.token, {
                        httpOnly: true,
                        secure: isHttps,
                        sameSite: isHttps ? 'none' : 'lax',
                    });

                    return value;
                } else {
                    return value;
                }
            }),
            catchError((err) => {
                return throwError(() => err);
            }),
        );
    }
}
