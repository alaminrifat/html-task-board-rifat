import dotenv from 'dotenv';
dotenv.config();

class EnvConfigService {
    constructor(private env: { [k: string]: string | undefined }) {}

    getValue(key: string, throwOnMissing = true): string {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`config error - missing env.${key}`);
        }
        return value as string;
    }

    public ensureValues(keys: string[]) {
        keys.forEach((k) => this.getValue(k, true));
        return this;
    }

    public getPort(): string {
        return this.getValue('PORT', true);
    }

    public isProduction(): boolean {
        const mode = this.getValue('MODE', false);
        return mode !== 'DEV';
    }

    public getFrontendUrl(): string {
        return this.getValue('FRONTEND_URL');
    }

    public getOrigins(): string[] {
        try {
            const origins = this.getValue('ALLOW_ORIGINS', false);
            if (origins) {
                return origins.split(',').map((origin) => origin.trim());
            }
        } catch {
            // fall through to fallback
        }

        // Fallback: use FRONTEND_URL and DASHBOARD_URL
        const fallback: string[] = [];
        try {
            const frontendUrl = this.getValue('FRONTEND_URL', false);
            if (frontendUrl) fallback.push(frontendUrl.trim());
        } catch {}
        try {
            const dashboardUrl = this.getValue('DASHBOARD_URL', false);
            if (dashboardUrl) fallback.push(dashboardUrl.trim());
        } catch {}

        return fallback.length > 0
            ? fallback
            : ['http://localhost:5173', 'http://localhost:5174'];
    }

    public getTypeOrmConfig() {
        return {
            host: this.getValue('DATABASE_HOST'),
            port: parseInt(this.getValue('DATABASE_PORT')),
            username: this.getValue('DATABASE_USERNAME'),
            password: this.getValue('DATABASE_PASSWORD'),
            database: this.getValue('DATABASE_NAME'),

            synchronize: false,
        };
    }

    public getAwsConfig() {
        return {
            AWS_REGION: this.getValue('AWS_REGION'),
            AWS_ACCESS_KEY_ID: this.getValue('AWS_ACCESS_KEY_ID'),
            AWS_SECRET_ACCESS_KEY: this.getValue('AWS_SECRET_ACCESS_KEY'),
            AWS_S3_BUCKET: this.getValue('AWS_S3_BUCKET'),
        };
    }

    public getMailConfig() {
        return {
            MAIL_HOST: this.getValue('MAIL_HOST', false) || 'smtp.gmail.com',
            MAIL_PORT: parseInt(this.getValue('MAIL_PORT', false)) || 587,
            MAIL_USER: this.getValue('MAIL_USER', false) || '',
            MAIL_PASSWORD: this.getValue('MAIL_PASSWORD', false) || '',
            MAIL_FROM: this.getValue('MAIL_FROM', false) || 'demo@example.com',
        };
    }

    public getAppleConfig() {
        return {
            APPLE_TEAM_ID: this.getValue('APPLE_TEAM_ID'),
            APPLE_CLIENT_ID: this.getValue('APPLE_CLIENT_ID'),
            APPLE_KEY_ID: this.getValue('APPLE_KEY_ID'),
            APPLE_PRIVATE_KEY: this.getValue('APPLE_PRIVATE_KEY').replace(
                /\\n/g,
                '\n',
            ),
        };
    }

    public getTossConfig() {
        return {
            TOSS_CLIENT_KEY:
                this.getValue('TOSS_CLIENT_KEY', false) || 'test_client_key',
            TOSS_SECRET_KEY:
                this.getValue('TOSS_SECRET_KEY', false) || 'test_secret_key',
            TOSS_API_URL:
                this.getValue('TOSS_API_URL', false) ||
                'https://api.tosspayments.com',
        };
    }

    public getPushNotificationConfig() {
        return {
            PROJECT_ID: this.getValue('PROJECT_ID'),
            PRIVATE_KEY_ID: this.getValue('PRIVATE_KEY_ID'),
            PRIVATE_KEY: this.getValue('PRIVATE_KEY'),
            CLIENT_EMAIL: this.getValue('CLIENT_EMAIL'),
        };
    }

    public getAuthJWTConfig() {
        return {
            AUTH_JWT_SECRET: this.getValue('AUTH_JWT_SECRET'),
            AUTH_TOKEN_COOKIE_NAME: this.getValue('AUTH_TOKEN_COOKIE_NAME'),
            AUTH_DASHBOARD_TOKEN_COOKIE_NAME:
                this.getValue('AUTH_DASHBOARD_TOKEN_COOKIE_NAME', false) ||
                'dashboardAccessToken',
            AUTH_TOKEN_EXPIRED_TIME: this.getValue('AUTH_TOKEN_EXPIRE_TIME'),
            AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME: this.getValue(
                'AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME',
            ),
            AUTH_REFRESH_TOKEN_COOKIE_NAME: this.getValue(
                'AUTH_REFRESH_TOKEN_COOKIE_NAME',
            ),
            AUTH_REFRESH_TOKEN_EXPIRED_TIME: this.getValue(
                'AUTH_REFRESH_TOKEN_EXPIRE_TIME',
            ),
        };
    }
}

const envConfigService = new EnvConfigService(process.env).ensureValues([
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
]);

export { envConfigService };
