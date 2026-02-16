import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { ActivityLog } from './activity-log.entity';
import { ActivityLogRepository } from './activity-log.repository';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ActivityAction } from '@shared/enums';
import { PaginationDto } from '@shared/dtos';

@Injectable()
export class ActivityLogsService extends BaseService<ActivityLog> {
    constructor(
        private readonly activityLogRepository: ActivityLogRepository,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
    ) {
        super(activityLogRepository, 'ActivityLog');
    }

    // ─── Foundational Method (used by other services) ─────────────

    /**
     * Log an activity for a project.
     * This is the foundational method other services call to record activity.
     */
    async logActivity(
        projectId: string,
        userId: string | null,
        action: ActivityAction,
        taskId?: string,
        details?: Record<string, unknown>,
    ): Promise<ActivityLog> {
        return this.activityLogRepository.create({
            projectId,
            userId: userId ?? null,
            action,
            taskId: taskId ?? null,
            details: details ?? null,
        });
    }

    // ─── Controller-Facing Methods ────────────────────────────────

    /**
     * Get paginated activity feed for a project.
     * Validates that the requesting user is a member of the project.
     */
    async getProjectActivity(
        userId: string,
        projectId: string,
        pagination: PaginationDto,
    ): Promise<{
        data: ActivityLog[];
        total: number;
        page: number;
        limit: number;
    }> {
        await this.validateMembership(userId, projectId);

        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 10;

        const result = await this.activityLogRepository.findByProject(
            projectId,
            page,
            limit,
        );

        return {
            data: result.data,
            total: result.total,
            page,
            limit,
        };
    }

    // ─── Private Helpers ──────────────────────────────────────────

    /**
     * Validate that the user is a member of the project.
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<void> {
        const member = await this.memberRepo.findOne({
            where: { projectId, userId },
        });

        if (!member) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }
    }
}
