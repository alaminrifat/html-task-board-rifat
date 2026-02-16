import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {
        super(notificationRepository);
    }

    /**
     * Find paginated notifications for a user, ordered by createdAt DESC.
     */
    async findByUser(
        userId: string,
        page: number,
        limit: number,
    ): Promise<{ data: Notification[]; total: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificationRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total };
    }

    /**
     * Count unread notifications for a user.
     */
    async countUnread(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }
}
