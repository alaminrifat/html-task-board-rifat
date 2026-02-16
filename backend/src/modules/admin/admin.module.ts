import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { Label } from '@modules/labels/label.entity';
import { User } from '@modules/users/user.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Task } from '@modules/tasks/task.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { PasswordResetToken } from '@modules/auth/entities/password-reset-token.entity';
import { Project } from '@modules/projects/project.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminProjectsController } from './admin-projects.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminExportController } from './admin-export.controller';
import { AdminService } from './admin.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminUsersService } from './admin-users.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminProjectsService } from './admin-projects.service';
import { AdminExportService } from './admin-export.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemSetting,
            Label,
            User,
            ProjectMember,
            Task,
            RefreshToken,
            TimeEntry,
            PasswordResetToken,
            Project,
            BoardColumn,
            ActivityLog,
        ]),
    ],
    controllers: [
        AdminDashboardController,
        AdminUsersController,
        AdminProjectsController,
        AdminSettingsController,
        AdminExportController,
    ],
    providers: [
        AdminService,
        AdminSettingsService,
        AdminUsersService,
        AdminDashboardService,
        AdminProjectsService,
        AdminExportService,
    ],
    exports: [
        AdminService,
        AdminSettingsService,
        AdminUsersService,
        AdminDashboardService,
        AdminProjectsService,
        AdminExportService,
    ],
})
export class AdminModule {}
