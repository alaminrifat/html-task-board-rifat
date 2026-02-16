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
        const isProduction =
            this.configService.get<string>('MODE') !== 'DEV';

        const frontendCookieName =
            this.configService.get<string>('AUTH_TOKEN_COOKIE_NAME') ||
            'accessToken';
        const dashboardCookieName =
            this.configService.get<string>(
                'AUTH_DASHBOARD_TOKEN_COOKIE_NAME',
            ) || 'dashboardAccessToken';

        // Determine which cookie to set based on the request
        const isDashboard =
            req.url?.includes('admin-login') ||
            (req.cookies && req.cookies[dashboardCookieName]);

        const cookieName = isDashboard
            ? dashboardCookieName
            : frontendCookieName;

        return next.handle().pipe(
            map((value) => {
                if (value.success && value.data?.token) {
                    res.cookie(cookieName, value.data.token, {
                        httpOnly: true,
                        secure: isProduction,
                        sameSite: isProduction ? 'none' : 'lax',
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
