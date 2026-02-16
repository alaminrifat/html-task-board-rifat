import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Task } from '@modules/tasks/task.entity';
import { SubTask } from '@modules/sub-tasks/sub-task.entity';
import { Comment } from '@modules/comments/comment.entity';
import { Attachment } from '@modules/attachments/attachment.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { PasswordResetToken } from '@modules/auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '@modules/auth/entities/email-verification-token.entity';
import { Invitation } from '@modules/invitations/invitation.entity';
import { UserDevice } from '@modules/users/entities/user-device.entity';
import { Notification } from '@modules/notifications/notification.entity';
import { SystemSetting } from '@modules/admin/entities/system-setting.entity';
import { BoardColumn } from '@modules/columns/column.entity';

import { ScheduledTasksService } from './scheduled-tasks.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([
            Task,
            SubTask,
            Comment,
            Attachment,
            TimeEntry,
            RefreshToken,
            PasswordResetToken,
            EmailVerificationToken,
            Invitation,
            UserDevice,
            Notification,
            SystemSetting,
            BoardColumn,
        ]),
    ],
    providers: [ScheduledTasksService],
    exports: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
