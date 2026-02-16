import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/users/user.entity';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { UserStatus, ProjectStatus } from '@shared/enums';
import { AdminDashboardFilterDto } from './dtos';

@Injectable()
export class AdminDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
    ) {}

    /**
     * Resolve the date range from the period filter.
     */
    private resolvePeriod(filter: AdminDashboardFilterDto): {
        type: string;
        from: Date;
        to: Date;
    } {
        const now = new Date();
        const to = filter.dateTo
            ? new Date(filter.dateTo + 'T23:59:59.999Z')
            : now;
        let from: Date;
        let type = filter.period || '30d';

        switch (type) {
            case 'today': {
                from = new Date(now);
                from.setUTCHours(0, 0, 0, 0);
                break;
            }
            case '7d': {
                from = new Date(now);
                from.setUTCDate(from.getUTCDate() - 7);
                from.setUTCHours(0, 0, 0, 0);
                break;
            }
            case 'custom': {
                from = filter.dateFrom
                    ? new Date(filter.dateFrom + 'T00:00:00.000Z')
                    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            }
            case '30d':
            default: {
                type = '30d';
                from = new Date(now);
                from.setUTCDate(from.getUTCDate() - 30);
                from.setUTCHours(0, 0, 0, 0);
                break;
            }
        }

        return { type, from, to };
    }

    /**
     * GET /admin/dashboard/stats
     */
    async getStats(filter: AdminDashboardFilterDto) {
        const period = this.resolvePeriod(filter);

        const [totalUsers, totalProjects, totalTasks, activeUsersToday] =
            await Promise.all([
                // Total users where status != DELETED
                this.userRepo
                    .createQueryBuilder('u')
                    .where('u.status != :deleted', {
                        deleted: UserStatus.DELETED,
                    })
                    .getCount(),

                // Total projects where status != ARCHIVED and not soft-deleted
                this.projectRepo
                    .createQueryBuilder('p')
                    .where('p.status != :archived', {
                        archived: ProjectStatus.ARCHIVED,
                    })
                    .andWhere('p.deletedAt IS NULL')
                    .getCount(),

                // Total tasks where not soft-deleted
                this.taskRepo
                    .createQueryBuilder('t')
                    .where('t.deletedAt IS NULL')
                    .getCount(),

                // Active users with lastActiveAt >= period.from
                this.userRepo
                    .createQueryBuilder('u')
                    .where('u.lastActiveAt >= :from', { from: period.from })
                    .andWhere('u.status != :deleted', {
                        deleted: UserStatus.DELETED,
                    })
                    .getCount(),
            ]);

        return {
            totalUsers,
            totalProjects,
            totalTasks,
            activeUsersToday,
            period: {
                type: period.type,
                from: period.from.toISOString(),
                to: period.to.toISOString(),
            },
        };
    }

    /**
     * GET /admin/dashboard/charts
     */
    async getCharts(filter: AdminDashboardFilterDto) {
        const period = this.resolvePeriod(filter);

        const [
            userRegistrationTrend,
            projectCreationTrend,
            taskCompletionRate,
            top5ActiveProjects,
        ] = await Promise.all([
            // User registration trend: daily count of new registrations
            this.userRepo
                .createQueryBuilder('u')
                .select("DATE_TRUNC('day', u.created_at)", 'date')
                .addSelect('COUNT(*)', 'count')
                .where('u.created_at >= :from', { from: period.from })
                .andWhere('u.created_at <= :to', { to: period.to })
                .groupBy("DATE_TRUNC('day', u.created_at)")
                .orderBy('date', 'ASC')
                .getRawMany(),

            // Project creation trend: daily count of new projects
            this.projectRepo
                .createQueryBuilder('p')
                .select("DATE_TRUNC('day', p.created_at)", 'date')
                .addSelect('COUNT(*)', 'count')
                .where('p.created_at >= :from', { from: period.from })
                .andWhere('p.created_at <= :to', { to: period.to })
                .andWhere('p.deletedAt IS NULL')
                .groupBy("DATE_TRUNC('day', p.created_at)")
                .orderBy('date', 'ASC')
                .getRawMany(),

            // Task completion rate: daily completed vs total
            this.getTaskCompletionRate(period.from, period.to),

            // Top 5 active projects by activity count in period
            this.activityLogRepo
                .createQueryBuilder('al')
                .select('al.project_id', 'projectId')
                .addSelect('p.title', 'projectTitle')
                .addSelect('COUNT(*)', 'activityCount')
                .innerJoin('al.project', 'p')
                .where('al.created_at >= :from', { from: period.from })
                .andWhere('al.created_at <= :to', { to: period.to })
                .andWhere('p.deletedAt IS NULL')
                .groupBy('al.project_id')
                .addGroupBy('p.title')
                .orderBy('"activityCount"', 'DESC')
                .limit(5)
                .getRawMany(),
        ]);

        return {
            userRegistrationTrend: userRegistrationTrend.map((row) => ({
                date: row.date,
                count: Number(row.count),
            })),
            projectCreationTrend: projectCreationTrend.map((row) => ({
                date: row.date,
                count: Number(row.count),
            })),
            taskCompletionRate,
            top5ActiveProjects: top5ActiveProjects.map((row) => ({
                projectId: row.projectId,
                projectTitle: row.projectTitle,
                activityCount: Number(row.activityCount),
            })),
            period: {
                type: period.type,
                from: period.from.toISOString(),
                to: period.to.toISOString(),
            },
        };
    }

    /**
     * Compute daily task completion rate.
     * "Completed" tasks are those in the LAST column (highest position) of their project.
     */
    private async getTaskCompletionRate(from: Date, to: Date) {
        // Get tasks created within the period, grouped by day, along with completion info.
        // A task is "completed" if it's in the column with the highest position for its project.
        const rawData = await this.taskRepo
            .createQueryBuilder('t')
            .select("DATE_TRUNC('day', t.created_at)", 'date')
            .addSelect('COUNT(*)', 'total')
            .addSelect(
                `COUNT(*) FILTER (WHERE t.column_id IN (
                    SELECT c.id FROM columns c
                    WHERE c.project_id = t.project_id
                    AND c.position = (
                        SELECT MAX(c2.position) FROM columns c2
                        WHERE c2.project_id = t.project_id
                    )
                ))`,
                'completed',
            )
            .where('t.created_at >= :from', { from })
            .andWhere('t.created_at <= :to', { to })
            .andWhere('t.deletedAt IS NULL')
            .groupBy("DATE_TRUNC('day', t.created_at)")
            .orderBy('date', 'ASC')
            .getRawMany();

        return rawData.map((row) => {
            const total = Number(row.total);
            const completed = Number(row.completed);
            return {
                date: row.date,
                completed,
                total,
                rate:
                    total > 0
                        ? Math.round((completed / total) * 100 * 100) / 100
                        : 0,
            };
        });
    }

    /**
     * GET /admin/dashboard/recent-activity
     * Latest 10 activity logs across all projects.
     */
    async getRecentActivity() {
        const activities = await this.activityLogRepo
            .createQueryBuilder('al')
            .innerJoin('al.project', 'p')
            .leftJoin('al.user', 'u')
            .leftJoin('al.task', 'task')
            .select([
                'al.id',
                'al.action',
                'al.details',
                'al.createdAt',
                'al.taskId',
                'u.id',
                'u.fullName',
                'u.avatarUrl',
                'p.id',
                'p.title',
                'task.id',
                'task.title',
            ])
            .where('p.deletedAt IS NULL')
            .orderBy('al.createdAt', 'DESC')
            .limit(10)
            .getMany();

        return activities.map((al) => ({
            id: al.id,
            action: al.action,
            user: al.user
                ? {
                      id: al.user.id,
                      name: al.user.fullName,
                      avatarUrl: (al.user as any).avatarUrl || null,
                  }
                : null,
            project: {
                id: al.project.id,
                title: al.project.title,
            },
            taskId: al.taskId,
            taskTitle: al.task?.title || null,
            details: al.details,
            createdAt: al.createdAt,
        }));
    }
}
