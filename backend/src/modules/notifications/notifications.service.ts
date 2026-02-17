import {
    Injectable,
    Inject,
    Logger,
    NotFoundException,
    ForbiddenException,
    forwardRef,
} from '@nestjs/common';
import { BaseService } from '@core/base/base.service';
import { Notification } from './notification.entity';
import { NotificationRepository } from './notification.repository';
import { NotificationType } from '@shared/enums';
import { PaginationDto } from '@shared/dtos';
import { UserRepository } from '@modules/users/user.repository';
import type { User } from '@modules/users/user.entity';

/**
 * Maps each NotificationType to the corresponding boolean preference field on the User entity.
 * When the user has set the field to `false`, we skip creating that notification type.
 */
const NOTIFICATION_PREF_MAP: Record<NotificationType, keyof User> = {
    [NotificationType.TASK_ASSIGNED]: 'notifyTaskAssigned',
    [NotificationType.DUE_DATE_REMINDER]: 'notifyDueDateReminder',
    [NotificationType.STATUS_CHANGE]: 'notifyStatusChange',
    [NotificationType.COMMENT_MENTION]: 'notifyCommentMention',
    [NotificationType.NEW_COMMENT]: 'notifyNewComment',
    [NotificationType.INVITATION]: 'notifyInvitation',
    [NotificationType.PROJECT_CREATED]: 'notifyProjectCreated',
};

@Injectable()
export class NotificationsService extends BaseService<Notification> {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly notificationRepository: NotificationRepository,
        @Inject(forwardRef(() => UserRepository))
        private readonly userRepository: UserRepository,
    ) {
        super(notificationRepository, 'Notification');
    }

    // ─── Foundational Method (used by other services) ─────────────

    /**
     * Create a notification for a user.
     * Checks the user's per-type notification preference toggle first.
     * Returns `null` when the user has disabled that notification type.
     */
    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        taskId?: string,
        projectId?: string,
    ): Promise<Notification | null> {
        try {
            // Check if the user has this notification type enabled
            const prefField = NOTIFICATION_PREF_MAP[type];
            if (prefField) {
                const user = await this.userRepository.findById(userId);
                if (user && user[prefField] === false) {
                    this.logger.debug(
                        `Skipping ${type} notification for user ${userId} — preference disabled`,
                    );
                    return null;
                }
            }

            return await this.notificationRepository.create({
                userId,
                type,
                title,
                message,
                taskId: taskId ?? null,
                projectId: projectId ?? null,
                isRead: false,
            });
        } catch (error) {
            this.logger.error(
                `Failed to create notification for user ${userId}: ${(error as Error).message}`,
                (error as Error).stack,
            );
            return null;
        }
    }

    // ─── Controller-Facing Methods ────────────────────────────────

    /**
     * Get paginated notifications for a user, along with unread count.
     */
    async getNotifications(
        userId: string,
        pagination: PaginationDto,
    ): Promise<{
        data: Notification[];
        total: number;
        page: number;
        limit: number;
        unreadCount: number;
    }> {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 10;

        const [result, unreadCount] = await Promise.all([
            this.notificationRepository.findByUser(userId, page, limit),
            this.notificationRepository.countUnread(userId),
        ]);

        return {
            data: result.data,
            total: result.total,
            page,
            limit,
            unreadCount,
        };
    }

    /**
     * Mark a single notification as read.
     * Validates that the notification belongs to the user.
     */
    async markAsRead(
        userId: string,
        notificationId: string,
    ): Promise<Notification> {
        const notification = await this.findAndValidateOwnership(
            userId,
            notificationId,
        );

        notification.isRead = true;
        return this.notificationRepository
            .update(notificationId, { isRead: true })
            .then((updated) => updated ?? notification);
    }

    /**
     * Mark all notifications as read for a user.
     */
    async markAllAsRead(userId: string): Promise<void> {
        const notifications = await this.notificationRepository.findAll({
            where: { userId, isRead: false } as any,
        });

        await Promise.all(
            (notifications ?? []).map((n) =>
                this.notificationRepository.update(n.id, { isRead: true }),
            ),
        );
    }

    /**
     * Delete a notification.
     * Validates that the notification belongs to the user.
     */
    async deleteNotification(
        userId: string,
        notificationId: string,
    ): Promise<void> {
        await this.findAndValidateOwnership(userId, notificationId);
        await this.notificationRepository.delete(notificationId);
    }

    // ─── Private Helpers ──────────────────────────────────────────

    /**
     * Find a notification by ID and validate that it belongs to the user.
     */
    private async findAndValidateOwnership(
        userId: string,
        notificationId: string,
    ): Promise<Notification> {
        const notification =
            await this.notificationRepository.findById(notificationId);

        if (!notification) {
            throw new NotFoundException(
                `Notification with ID ${notificationId} not found`,
            );
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException(
                'You do not have access to this notification',
            );
        }

        return notification;
    }
}
