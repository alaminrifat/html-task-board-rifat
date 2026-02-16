import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class RemoveToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();

        const frontendCookieName =
            this.configService.get<string>('AUTH_TOKEN_COOKIE_NAME') ||
            'accessToken';
        const dashboardCookieName =
            this.configService.get<string>(
                'AUTH_DASHBOARD_TOKEN_COOKIE_NAME',
            ) || 'dashboardAccessToken';

        return next.handle().pipe(
            map((value) => {
                if (value.success) {
                    // Clear both cookies — safe even if one doesn't exist
                    res.cookie(frontendCookieName, '', {
                        httpOnly: true,
                        maxAge: 0,
                    });
                    res.cookie(dashboardCookieName, '', {
                        httpOnly: true,
                        maxAge: 0,
                    });
                    return {
                        success: true,
                        message: value.message,
                        refreshToken: value?.refreshToken,
                    };
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
