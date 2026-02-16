import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';

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
import { InvitationStatus, NotificationType } from '@shared/enums';

@Injectable()
export class ScheduledTasksService {
    private readonly logger = new Logger(ScheduledTasksService.name);

    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(SubTask)
        private readonly subTaskRepository: Repository<SubTask>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Attachment)
        private readonly attachmentRepository: Repository<Attachment>,
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepository: Repository<TimeEntry>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @InjectRepository(PasswordResetToken)
        private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
        @InjectRepository(EmailVerificationToken)
        private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
        @InjectRepository(UserDevice)
        private readonly userDeviceRepository: Repository<UserDevice>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(SystemSetting)
        private readonly systemSettingRepository: Repository<SystemSetting>,
        @InjectRepository(BoardColumn)
        private readonly boardColumnRepository: Repository<BoardColumn>,
    ) {}

    // ─── 1. Trash Auto-Purge (Daily at 2:00 AM UTC) ──────────────────────

    @Cron('0 2 * * *')
    async purgeTrash(): Promise<void> {
        try {
            this.logger.log('Starting trash auto-purge...');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);

            // Find tasks that have been soft-deleted for more than 30 days
            // We need to use withDeleted + where deletedAt to find soft-deleted tasks
            const staleTasks = await this.taskRepository
                .createQueryBuilder('task')
                .withDeleted()
                .where('task.deleted_at IS NOT NULL')
                .andWhere('task.deleted_at < :cutoffDate', { cutoffDate })
                .select(['task.id'])
                .getMany();

            if (staleTasks.length === 0) {
                this.logger.log('No stale trashed tasks to purge.');
                return;
            }

            const taskIds = staleTasks.map((t) => t.id);
            this.logger.log(
                `Found ${taskIds.length} trashed task(s) older than 30 days. Purging...`,
            );

            // Delete from most dependent to least dependent to respect FK constraints
            // 1. Time entries
            await this.timeEntryRepository
                .createQueryBuilder()
                .delete()
                .where('task_id IN (:...taskIds)', { taskIds })
                .execute();

            // 2. Attachments
            await this.attachmentRepository
                .createQueryBuilder()
                .delete()
                .where('task_id IN (:...taskIds)', { taskIds })
                .execute();

            // 3. Comments (delete children first due to self-referencing parent_id)
            // Delete all comments for these tasks - children have CASCADE on parent_id,
            // but we delete the parent relationship via task_id
            await this.commentRepository
                .createQueryBuilder()
                .delete()
                .where('task_id IN (:...taskIds)', { taskIds })
                .execute();

            // 4. Sub-tasks
            await this.subTaskRepository
                .createQueryBuilder()
                .delete()
                .where('task_id IN (:...taskIds)', { taskIds })
                .execute();

            // 5. Task labels (join table - delete via raw query)
            await this.taskRepository.manager.query(
                `DELETE FROM task_labels WHERE task_id = ANY($1)`,
                [taskIds],
            );

            // 6. Notifications referencing these tasks (set task_id to null to avoid FK issues)
            await this.notificationRepository
                .createQueryBuilder()
                .update()
                .set({ taskId: null as unknown as string })
                .where('task_id IN (:...taskIds)', { taskIds })
                .execute();

            // 7. Finally, hard-delete the tasks themselves (bypass soft delete)
            await this.taskRepository
                .createQueryBuilder()
                .delete()
                .where('id IN (:...taskIds)', { taskIds })
                .execute();

            this.logger.log(
                `Trash auto-purge completed. Purged ${taskIds.length} task(s) and associated data.`,
            );
        } catch (error) {
            this.logger.error(
                'Trash auto-purge failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    // ─── 2. Token Cleanup (Daily at 3:00 AM UTC) ─────────────────────────

    @Cron('0 3 * * *')
    async cleanupExpiredTokens(): Promise<void> {
        try {
            this.logger.log('Starting expired token cleanup...');
            const now = new Date();

            // Delete expired refresh tokens
            const refreshResult = await this.refreshTokenRepository.delete({
                expiresAt: LessThan(now),
            });
            this.logger.log(
                `Deleted ${refreshResult.affected ?? 0} expired refresh token(s).`,
            );

            // Delete expired or used password reset tokens
            const passwordResetResult = await this.passwordResetTokenRepository
                .createQueryBuilder()
                .delete()
                .where('expires_at < :now', { now })
                .orWhere('is_used = :isUsed', { isUsed: true })
                .execute();
            this.logger.log(
                `Deleted ${passwordResetResult.affected ?? 0} expired/used password reset token(s).`,
            );

            // Delete expired or used email verification tokens
            const emailVerificationResult =
                await this.emailVerificationTokenRepository
                    .createQueryBuilder()
                    .delete()
                    .where('expires_at < :now', { now })
                    .orWhere('is_used = :isUsed', { isUsed: true })
                    .execute();
            this.logger.log(
                `Deleted ${emailVerificationResult.affected ?? 0} expired/used email verification token(s).`,
            );

            this.logger.log('Expired token cleanup completed.');
        } catch (error) {
            this.logger.error(
                'Expired token cleanup failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    // ─── 3. Invitation Expiry (Daily at 3:00 AM UTC) ─────────────────────

    @Cron('0 3 * * *')
    async expireInvitations(): Promise<void> {
        try {
            this.logger.log('Starting invitation expiry check...');
            const now = new Date();

            const result = await this.invitationRepository
                .createQueryBuilder()
                .update()
                .set({ status: InvitationStatus.EXPIRED })
                .where('status = :status', { status: InvitationStatus.PENDING })
                .andWhere('expires_at < :now', { now })
                .execute();

            this.logger.log(
                `Expired ${result.affected ?? 0} pending invitation(s).`,
            );
        } catch (error) {
            this.logger.error(
                'Invitation expiry check failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    // ─── 4. Deadline Reminders (Hourly) ───────────────────────────────────

    @Cron('0 * * * *')
    async sendDeadlineReminders(): Promise<void> {
        try {
            this.logger.log('Starting deadline reminder check...');

            // Get the deadline_reminder_hours from system settings (default 24)
            let reminderHours = 24;
            const setting = await this.systemSettingRepository.findOne({
                where: { key: 'deadline_reminder_hours' },
            });
            if (setting?.value !== undefined) {
                const parsed =
                    typeof setting.value === 'number'
                        ? setting.value
                        : Number(setting.value);
                if (!isNaN(parsed) && parsed > 0) {
                    reminderHours = parsed;
                }
            }

            const now = new Date();
            const reminderThreshold = new Date(
                now.getTime() + reminderHours * 60 * 60 * 1000,
            );

            // For each project, find the last column (highest position = "completed" column)
            // We need to exclude tasks in the last column of their project
            // Subquery: get the max column position per project
            const tasks = await this.taskRepository
                .createQueryBuilder('task')
                .innerJoin('task.column', 'col')
                .where('task.due_date > :now', {
                    now: now.toISOString().split('T')[0],
                })
                .andWhere('task.due_date <= :threshold', {
                    threshold: reminderThreshold.toISOString().split('T')[0],
                })
                .andWhere('task.deleted_at IS NULL')
                .andWhere('task.assignee_id IS NOT NULL')
                .andWhere(
                    // Exclude tasks in the last column of their project
                    `col.position < (
                        SELECT MAX(c2.position)
                        FROM columns c2
                        WHERE c2.project_id = task.project_id
                    )`,
                )
                .select([
                    'task.id',
                    'task.title',
                    'task.assigneeId',
                    'task.projectId',
                    'task.dueDate',
                ])
                .getMany();

            if (tasks.length === 0) {
                this.logger.log('No tasks approaching deadline.');
                return;
            }

            let sentCount = 0;

            for (const task of tasks) {
                // Check for duplicate notifications within the last 24 hours
                const twentyFourHoursAgo = new Date(
                    now.getTime() - 24 * 60 * 60 * 1000,
                );

                const existingNotification =
                    await this.notificationRepository.findOne({
                        where: {
                            taskId: task.id,
                            userId: task.assigneeId!,
                            type: NotificationType.DUE_DATE_REMINDER,
                            createdAt: MoreThan(twentyFourHoursAgo),
                        },
                    });

                if (existingNotification) {
                    continue; // Already notified within 24h
                }

                // Create the deadline reminder notification
                const notification = this.notificationRepository.create({
                    userId: task.assigneeId!,
                    type: NotificationType.DUE_DATE_REMINDER,
                    title: 'Due Date Reminder',
                    message: `Task "${task.title}" is due soon.`,
                    taskId: task.id,
                    projectId: task.projectId,
                    isRead: false,
                });

                await this.notificationRepository.save(notification);
                sentCount++;
            }

            this.logger.log(
                `Deadline reminder check completed. Sent ${sentCount} reminder(s).`,
            );
        } catch (error) {
            this.logger.error(
                'Deadline reminder check failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    // ─── 5. Stale Device Cleanup (Daily at 4:00 AM UTC) ──────────────────

    @Cron('0 4 * * *')
    async cleanupStaleDevices(): Promise<void> {
        try {
            this.logger.log('Starting stale device cleanup...');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);

            // UserDevice extends BaseEntity which has updatedAt
            const result = await this.userDeviceRepository
                .createQueryBuilder()
                .delete()
                .where('updated_at < :cutoffDate', { cutoffDate })
                .execute();

            this.logger.log(
                `Stale device cleanup completed. Removed ${result.affected ?? 0} device(s) not updated in 90 days.`,
            );
        } catch (error) {
            this.logger.error(
                'Stale device cleanup failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}
