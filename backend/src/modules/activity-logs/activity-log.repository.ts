import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { ActivityLog } from './activity-log.entity';

@Injectable()
export class ActivityLogRepository extends BaseRepository<ActivityLog> {
    constructor(
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) {
        super(activityLogRepository);
    }

    /**
     * Find paginated activity logs for a project, with user relation loaded,
     * ordered by createdAt DESC.
     */
    async findByProject(
        projectId: string,
        page: number,
        limit: number,
    ): Promise<{ data: ActivityLog[]; total: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.activityLogRepository.findAndCount({
            where: { projectId },
            relations: { user: true },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total };
    }
}
