import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './notification.repository';
import { Notification } from './notification.entity';
import { NotificationType } from '@shared/enums';
import { UserRepository } from '@modules/users/user.repository';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let notificationRepository: jest.Mocked<Partial<NotificationRepository>>;
    let userRepository: jest.Mocked<Partial<UserRepository>>;

    const userId = 'user-uuid-1';
    const otherUserId = 'user-uuid-2';
    const notificationId = 'notification-uuid-1';

    const mockNotification: Partial<Notification> = {
        id: notificationId,
        userId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        taskId: 'task-uuid-1',
        projectId: 'project-uuid-1',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    /** Default mock user with all notification prefs enabled */
    const mockUserAllEnabled = {
        id: userId,
        notifyTaskAssigned: true,
        notifyDueDateReminder: true,
        notifyStatusChange: true,
        notifyCommentMention: true,
        notifyNewComment: true,
        notifyInvitation: true,
    };

    const _mockReadNotification: Partial<Notification> = {
        ...mockNotification,
        id: 'notification-uuid-2',
        isRead: true,
    };

    beforeEach(async () => {
        notificationRepository = {
            create: jest.fn(),
            findByUser: jest.fn(),
            countUnread: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
        };

        userRepository = {
            findById: jest.fn().mockResolvedValue({ ...mockUserAllEnabled }),
        };

        service = new NotificationsService(
            notificationRepository as any,
            userRepository as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── createNotification ─────────────────────────────────────────

    describe('createNotification', () => {
        it('should create a notification with all fields when preference is enabled', async () => {
            const createdNotification = { ...mockNotification } as Notification;
            (notificationRepository.create as jest.Mock).mockResolvedValue(
                createdNotification,
            );

            const result = await service.createNotification(
                userId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                'You have been assigned a task',
                'task-uuid-1',
                'project-uuid-1',
            );

            expect(userRepository.findById).toHaveBeenCalledWith(userId);
            expect(notificationRepository.create).toHaveBeenCalledWith({
                userId,
                type: NotificationType.TASK_ASSIGNED,
                title: 'Task Assigned',
                message: 'You have been assigned a task',
                taskId: 'task-uuid-1',
                projectId: 'project-uuid-1',
                isRead: false,
            });
            expect(result).toBeDefined();
            expect(result!.isRead).toBe(false);
        });

        it('should create a notification without optional taskId and projectId', async () => {
            const createdNotification = {
                ...mockNotification,
                taskId: null,
                projectId: null,
            } as Notification;
            (notificationRepository.create as jest.Mock).mockResolvedValue(
                createdNotification,
            );

            const result = await service.createNotification(
                userId,
                NotificationType.DUE_DATE_REMINDER,
                'Reminder',
                'You have a deadline approaching',
            );

            expect(notificationRepository.create).toHaveBeenCalledWith({
                userId,
                type: NotificationType.DUE_DATE_REMINDER,
                title: 'Reminder',
                message: 'You have a deadline approaching',
                taskId: null,
                projectId: null,
                isRead: false,
            });
            expect(result).toBeDefined();
        });

        it('should create notifications of different types', async () => {
            const commentNotification = {
                ...mockNotification,
                type: NotificationType.NEW_COMMENT,
                title: 'New Comment',
                message: 'Someone commented on your task',
            } as Notification;
            (notificationRepository.create as jest.Mock).mockResolvedValue(
                commentNotification,
            );

            const result = await service.createNotification(
                userId,
                NotificationType.NEW_COMMENT,
                'New Comment',
                'Someone commented on your task',
                'task-uuid-1',
            );

            expect(result!.type).toBe(NotificationType.NEW_COMMENT);
        });

        // ─── Preference Gating Tests ────────────────────────────────

        it('should return null when user has TASK_ASSIGNED preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyTaskAssigned: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                'You have been assigned a task',
                'task-uuid-1',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should return null when user has DUE_DATE_REMINDER preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyDueDateReminder: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.DUE_DATE_REMINDER,
                'Reminder',
                'Deadline approaching',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should return null when user has STATUS_CHANGE preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyStatusChange: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.STATUS_CHANGE,
                'Status Changed',
                'Task moved to In Progress',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should return null when user has COMMENT_MENTION preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyCommentMention: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.COMMENT_MENTION,
                'Mentioned',
                'You were mentioned in a comment',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should return null when user has NEW_COMMENT preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyNewComment: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.NEW_COMMENT,
                'New Comment',
                'Someone commented on your task',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should return null when user has INVITATION preference disabled', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyInvitation: false,
            });

            const result = await service.createNotification(
                userId,
                NotificationType.INVITATION,
                'Invitation',
                'You have been invited to a project',
            );

            expect(result).toBeNull();
            expect(notificationRepository.create).not.toHaveBeenCalled();
        });

        it('should still create notification when user is not found (defensive)', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            const createdNotification = { ...mockNotification } as Notification;
            (notificationRepository.create as jest.Mock).mockResolvedValue(
                createdNotification,
            );

            const result = await service.createNotification(
                userId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                'You have been assigned a task',
            );

            expect(result).toBeDefined();
            expect(notificationRepository.create).toHaveBeenCalled();
        });

        it('should return null and log error when repository throws', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
            });
            (notificationRepository.create as jest.Mock).mockRejectedValue(
                new Error('DB connection failed'),
            );

            const result = await service.createNotification(
                userId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                'You have been assigned a task',
            );

            expect(result).toBeNull();
        });

        it('should return null and log error when userRepository throws', async () => {
            (userRepository.findById as jest.Mock).mockRejectedValue(
                new Error('User lookup failed'),
            );

            const result = await service.createNotification(
                userId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                'You have been assigned a task',
            );

            expect(result).toBeNull();
        });

        it('should create notification when one pref is disabled but requesting a different type', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({
                ...mockUserAllEnabled,
                notifyTaskAssigned: false, // TASK_ASSIGNED disabled
            });
            const createdNotification = {
                ...mockNotification,
                type: NotificationType.NEW_COMMENT,
            } as Notification;
            (notificationRepository.create as jest.Mock).mockResolvedValue(
                createdNotification,
            );

            // Requesting NEW_COMMENT, which is still enabled
            const result = await service.createNotification(
                userId,
                NotificationType.NEW_COMMENT,
                'New Comment',
                'Someone commented',
            );

            expect(result).toBeDefined();
            expect(notificationRepository.create).toHaveBeenCalled();
        });
    });

    // ─── getNotifications ───────────────────────────────────────────

    describe('getNotifications', () => {
        it('should return paginated notifications with unread count', async () => {
            const paginatedResult = {
                data: [mockNotification as Notification],
                total: 1,
            };

            (notificationRepository.findByUser as jest.Mock).mockResolvedValue(
                paginatedResult,
            );
            (notificationRepository.countUnread as jest.Mock).mockResolvedValue(
                1,
            );

            const result = await service.getNotifications(userId, {
                page: 1,
                limit: 10,
            });

            expect(notificationRepository.findByUser).toHaveBeenCalledWith(
                userId,
                1,
                10,
            );
            expect(notificationRepository.countUnread).toHaveBeenCalledWith(
                userId,
            );
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.unreadCount).toBe(1);
        });

        it('should use default page and limit when not provided', async () => {
            const paginatedResult = { data: [], total: 0 };

            (notificationRepository.findByUser as jest.Mock).mockResolvedValue(
                paginatedResult,
            );
            (notificationRepository.countUnread as jest.Mock).mockResolvedValue(
                0,
            );

            const result = await service.getNotifications(userId, {});

            expect(notificationRepository.findByUser).toHaveBeenCalledWith(
                userId,
                1,
                10,
            );
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.unreadCount).toBe(0);
        });

        it('should return empty data with zero unread count', async () => {
            (notificationRepository.findByUser as jest.Mock).mockResolvedValue({
                data: [],
                total: 0,
            });
            (notificationRepository.countUnread as jest.Mock).mockResolvedValue(
                0,
            );

            const result = await service.getNotifications(userId, {
                page: 1,
                limit: 10,
            });

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.unreadCount).toBe(0);
        });
    });

    // ─── markAsRead ─────────────────────────────────────────────────

    describe('markAsRead', () => {
        it('should mark a notification as read when owner marks it', async () => {
            const updatedNotification = {
                ...mockNotification,
                isRead: true,
            } as Notification;

            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                mockNotification,
            );
            (notificationRepository.update as jest.Mock).mockResolvedValue(
                updatedNotification,
            );

            const result = await service.markAsRead(userId, notificationId);

            expect(notificationRepository.findById).toHaveBeenCalledWith(
                notificationId,
            );
            expect(notificationRepository.update).toHaveBeenCalledWith(
                notificationId,
                { isRead: true },
            );
            expect(result.isRead).toBe(true);
        });

        it('should throw NotFoundException when notification does not exist', async () => {
            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.markAsRead(userId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user does not own notification', async () => {
            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                mockNotification,
            );

            await expect(
                service.markAsRead(otherUserId, notificationId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── markAllAsRead ──────────────────────────────────────────────

    describe('markAllAsRead', () => {
        it('should mark all unread notifications as read for a user', async () => {
            const unreadNotifications = [
                { ...mockNotification, id: 'n-1' },
                { ...mockNotification, id: 'n-2' },
            ] as Notification[];

            (notificationRepository.findAll as jest.Mock).mockResolvedValue(
                unreadNotifications,
            );
            (notificationRepository.update as jest.Mock).mockResolvedValue(
                {} as any,
            );

            await expect(
                service.markAllAsRead(userId),
            ).resolves.toBeUndefined();

            expect(notificationRepository.findAll).toHaveBeenCalledWith({
                where: { userId, isRead: false },
            });
            expect(notificationRepository.update).toHaveBeenCalledTimes(2);
            expect(notificationRepository.update).toHaveBeenCalledWith('n-1', {
                isRead: true,
            });
            expect(notificationRepository.update).toHaveBeenCalledWith('n-2', {
                isRead: true,
            });
        });

        it('should handle case when no unread notifications exist', async () => {
            (notificationRepository.findAll as jest.Mock).mockResolvedValue([]);

            await expect(
                service.markAllAsRead(userId),
            ).resolves.toBeUndefined();

            expect(notificationRepository.update).not.toHaveBeenCalled();
        });

        it('should handle null return from findAll gracefully', async () => {
            (notificationRepository.findAll as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.markAllAsRead(userId),
            ).resolves.toBeUndefined();

            expect(notificationRepository.update).not.toHaveBeenCalled();
        });
    });

    // ─── deleteNotification ─────────────────────────────────────────

    describe('deleteNotification', () => {
        it('should delete notification when owner deletes', async () => {
            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                mockNotification,
            );
            (notificationRepository.delete as jest.Mock).mockResolvedValue(
                true,
            );

            await expect(
                service.deleteNotification(userId, notificationId),
            ).resolves.toBeUndefined();

            expect(notificationRepository.delete).toHaveBeenCalledWith(
                notificationId,
            );
        });

        it('should throw NotFoundException when notification does not exist', async () => {
            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.deleteNotification(userId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user does not own notification', async () => {
            (notificationRepository.findById as jest.Mock).mockResolvedValue(
                mockNotification,
            );

            await expect(
                service.deleteNotification(otherUserId, notificationId),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
