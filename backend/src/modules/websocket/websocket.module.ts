import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BoardGateway } from './board.gateway';

// Entities needed for direct repository access in the gateway
import { User } from '@modules/users/user.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';

// Feature modules for service injection
import { TasksModule } from '@modules/tasks/tasks.module';
import { ProjectMembersModule } from '@modules/project-members/project-members.module';

// Note: ActivityLogsModule and NotificationsModule are @Global() modules,
// so their services are available without explicit import here.

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Task, ProjectMember, BoardColumn]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret:
                    configService.get<string>('authJwtSecret') ||
                    configService.get<string>('AUTH_JWT_SECRET') ||
                    process.env.AUTH_JWT_SECRET,
            }),
        }),
        TasksModule,
        ProjectMembersModule,
    ],
    providers: [BoardGateway],
    exports: [BoardGateway],
})
export class WebSocketModule {}
