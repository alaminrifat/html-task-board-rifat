import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

//DB
import { TypeOrmModule } from '@nestjs/typeorm';
import { appDataSource } from './config/db.config';

//Config
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { CorsMiddleware } from './core/middleware';
import { UserModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard, JwtStrategy } from './core/guards';

// TaskBoard Modules
import { ProjectsModule } from '@modules/projects/projects.module';
import { ProjectMembersModule } from '@modules/project-members/project-members.module';
import { ColumnsModule } from '@modules/columns/columns.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { SubTasksModule } from '@modules/sub-tasks/sub-tasks.module';
import { CommentsModule } from '@modules/comments/comments.module';
import { AttachmentsModule } from '@modules/attachments/attachments.module';
import { TimeEntriesModule } from '@modules/time-entries/time-entries.module';
import { LabelsModule } from '@modules/labels/labels.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { ActivityLogsModule } from '@modules/activity-logs/activity-logs.module';
import { InvitationsModule } from '@modules/invitations/invitations.module';
import { AdminModule } from '@modules/admin/admin.module';
import { WebSocketModule } from '@modules/websocket/websocket.module';
import { ScheduledTasksModule } from '@modules/scheduled-tasks/scheduled-tasks.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'src/shared/icons'),
            serveRoot: '/diagnosis-icons',
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'src', 'test'),
            serveRoot: '/test',
        }),
        ConfigModule.forRoot({
            load: [jwtConfig],
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(appDataSource.options),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: join(process.cwd(), 'src/i18n'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
            ],
            typesOutputPath: join(
                process.cwd(),
                'src/generated/i18n.generated.ts',
            ),
            formatter: (template: string, ...args: any[]) => {
                let result = template;
                if (args[0]) {
                    Object.keys(args[0]).forEach((key) => {
                        result = result.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            args[0][key],
                        );
                        result = result.replace(
                            new RegExp(`\\{${key}\\}`, 'g'),
                            args[0][key],
                        );
                    });
                }
                return result;
            },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),

        // Core Modules
        UserModule,
        AuthModule,

        // TaskBoard Feature Modules
        ProjectsModule,
        ProjectMembersModule,
        ColumnsModule,
        TasksModule,
        SubTasksModule,
        CommentsModule,
        AttachmentsModule,
        TimeEntriesModule,
        LabelsModule,
        NotificationsModule,
        ActivityLogsModule,
        InvitationsModule,
        AdminModule,
        WebSocketModule,
        ScheduledTasksModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorsMiddleware).forRoutes('*');
    }
}
