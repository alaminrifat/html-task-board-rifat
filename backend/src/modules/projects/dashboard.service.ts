import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Task } from '@modules/tasks/task.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Project } from './project.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { SubTask } from '@modules/sub-tasks/sub-task.entity';
import { Comment } from '@modules/comments/comment.entity';
import { Attachment } from '@modules/attachments/attachment.entity';
import { Label } from '@modules/labels/label.entity';
import { User } from '@modules/users/user.entity';
import { ProjectRole, TaskPriority } from '@shared/enums';
import { DashboardFilterDto, DashboardChartsFilterDto } from './dtos';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepo: Repository<TimeEntry>,
        @InjectRepository(SubTask)
        private readonly subTaskRepo: Repository<SubTask>,
        @InjectRepository(Comment)
        private readonly commentRepo: Repository<Comment>,
        @InjectRepository(Attachment)
        private readonly attachmentRepo: Repository<Attachment>,
        @InjectRepository(Label)
        private readonly labelRepo: Repository<Label>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly i18nHelper: I18nHelper,
    ) {}

    // ─── Dashboard Summary ────────────────────────────────────────────

    async getSummary(
        userId: string,
        projectId: string,
        filters: DashboardFilterDto,
    ) {
        await this.validateMembership(userId, projectId);

        // Get the last column (highest position) for this project
        const lastColumn = await this.columnRepo
            .createQueryBuilder('col')
            .where('col.project_id = :projectId', { projectId })
            .orderBy('col.position', 'DESC')
            .getOne();

        const lastColumnId = lastColumn?.id;

        // Build base query for non-deleted tasks in this project
        const baseQb = this.taskRepo
            .createQueryBuilder('task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL');

        if (filters.dateFrom) {
            baseQb.andWhere('task.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            baseQb.andWhere('task.created_at <= :dateTo', {
                dateTo: filters.dateTo + 'T23:59:59.999Z',
            });
        }

        // Total tasks
        const totalTasks = await baseQb.getCount();

        // Completed tasks (tasks in the last column)
        let completedTasks = 0;
        if (lastColumnId) {
            const completedQb = baseQb.clone();
            completedQb.andWhere('task.column_id = :lastColumnId', {
                lastColumnId,
            });
            completedTasks = await completedQb.getCount();
        }

        // Overdue tasks (dueDate < today AND not in last column)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueQb = baseQb.clone();
        overdueQb.andWhere('task.due_date < :today', {
            today: today.toISOString().split('T')[0],
        });
        if (lastColumnId) {
            overdueQb.andWhere('task.column_id != :lastColumnId', {
                lastColumnId,
            });
        }
        const overdueTasks = await overdueQb.getCount();

        // Completion percent
        const completionPercent =
            totalTasks > 0
                ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2))
                : 0.0;

        // Total time logged for project tasks
        const timeResult = await this.timeEntryRepo
            .createQueryBuilder('te')
            .select('COALESCE(SUM(te.duration_minutes), 0)', 'total')
            .innerJoin('te.task', 'task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .getRawOne();

        const totalTimeLoggedMinutes = parseInt(timeResult?.total ?? '0', 10);

        return {
            totalTasks,
            completedTasks,
            overdueTasks,
            completionPercent,
            totalTimeLoggedMinutes,
        };
    }

    // ─── Dashboard Charts ─────────────────────────────────────────────

    async getCharts(
        userId: string,
        projectId: string,
        filters: DashboardChartsFilterDto,
    ) {
        await this.validateMembership(userId, projectId);

        const [
            tasksPerStatus,
            tasksPerPriority,
            memberWorkload,
            completionTrend,
        ] = await Promise.all([
            this.getTasksPerStatus(projectId, filters),
            this.getTasksPerPriority(projectId, filters),
            this.getMemberWorkload(projectId, filters),
            this.getCompletionTrend(projectId, filters),
        ]);

        return {
            tasksPerStatus,
            tasksPerPriority,
            memberWorkload,
            completionTrend,
        };
    }

    private async getTasksPerStatus(
        projectId: string,
        filters: DashboardChartsFilterDto,
    ) {
        const qb = this.taskRepo
            .createQueryBuilder('task')
            .select('col.title', 'column')
            .addSelect('COUNT(task.id)', 'count')
            .innerJoin('task.column', 'col')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL');

        if (filters.assigneeId) {
            qb.andWhere('task.assignee_id = :assigneeId', {
                assigneeId: filters.assigneeId,
            });
        }
        if (filters.priority) {
            qb.andWhere('task.priority = :priority', {
                priority: filters.priority,
            });
        }
        if (filters.dateFrom) {
            qb.andWhere('task.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            qb.andWhere('task.created_at <= :dateTo', {
                dateTo: filters.dateTo + 'T23:59:59.999Z',
            });
        }

        qb.groupBy('col.id')
            .addGroupBy('col.title')
            .addGroupBy('col.position')
            .orderBy('col.position', 'ASC');

        const results = await qb.getRawMany();
        return results.map((r) => ({
            column: r.column,
            count: parseInt(r.count, 10),
        }));
    }

    private async getTasksPerPriority(
        projectId: string,
        filters: DashboardChartsFilterDto,
    ) {
        const qb = this.taskRepo
            .createQueryBuilder('task')
            .select('task.priority', 'priority')
            .addSelect('COUNT(task.id)', 'count')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL');

        if (filters.assigneeId) {
            qb.andWhere('task.assignee_id = :assigneeId', {
                assigneeId: filters.assigneeId,
            });
        }
        if (filters.priority) {
            qb.andWhere('task.priority = :priority', {
                priority: filters.priority,
            });
        }
        if (filters.dateFrom) {
            qb.andWhere('task.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            qb.andWhere('task.created_at <= :dateTo', {
                dateTo: filters.dateTo + 'T23:59:59.999Z',
            });
        }

        qb.groupBy('task.priority');

        const results = await qb.getRawMany();
        const resultMap = new Map(
            results.map((r) => [r.priority, parseInt(r.count, 10)]),
        );

        // Return all priorities in defined order, defaulting to 0
        const priorityOrder = [
            TaskPriority.LOW,
            TaskPriority.MEDIUM,
            TaskPriority.HIGH,
            TaskPriority.URGENT,
        ];

        return priorityOrder.map((p) => ({
            priority: p,
            count: resultMap.get(p) ?? 0,
        }));
    }

    private async getMemberWorkload(
        projectId: string,
        filters: DashboardChartsFilterDto,
    ) {
        // Get the last column for "completed" determination
        const lastColumn = await this.columnRepo
            .createQueryBuilder('col')
            .where('col.project_id = :projectId', { projectId })
            .orderBy('col.position', 'DESC')
            .getOne();

        const lastColumnId = lastColumn?.id;

        // Get all project members
        const members = await this.memberRepo.find({
            where: { projectId },
            relations: { user: true },
        });

        // Build query for assigned tasks count per user
        const assignedQb = this.taskRepo
            .createQueryBuilder('task')
            .select('task.assignee_id', 'assigneeId')
            .addSelect('COUNT(task.id)', 'assignedTasks')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL');

        if (filters.dateFrom) {
            assignedQb.andWhere('task.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            assignedQb.andWhere('task.created_at <= :dateTo', {
                dateTo: filters.dateTo + 'T23:59:59.999Z',
            });
        }

        assignedQb.groupBy('task.assignee_id');
        const assignedResults = await assignedQb.getRawMany();
        const assignedMap = new Map(
            assignedResults.map((r) => [
                r.assigneeId,
                parseInt(r.assignedTasks, 10),
            ]),
        );

        // Build query for completed tasks count per user
        let completedMap = new Map<string | null, number>();
        if (lastColumnId) {
            const completedQb = this.taskRepo
                .createQueryBuilder('task')
                .select('task.assignee_id', 'assigneeId')
                .addSelect('COUNT(task.id)', 'completedTasks')
                .where('task.project_id = :projectId', { projectId })
                .andWhere('task.deleted_at IS NULL')
                .andWhere('task.column_id = :lastColumnId', { lastColumnId });

            if (filters.dateFrom) {
                completedQb.andWhere('task.created_at >= :dateFrom', {
                    dateFrom: filters.dateFrom,
                });
            }
            if (filters.dateTo) {
                completedQb.andWhere('task.created_at <= :dateTo', {
                    dateTo: filters.dateTo + 'T23:59:59.999Z',
                });
            }

            completedQb.groupBy('task.assignee_id');
            const completedResults = await completedQb.getRawMany();
            completedMap = new Map(
                completedResults.map((r) => [
                    r.assigneeId,
                    parseInt(r.completedTasks, 10),
                ]),
            );
        }

        // Build workload entries for each member
        const workload = members.map((m) => ({
            userId: m.userId,
            name: m.user?.fullName ?? m.user?.email ?? 'Unknown',
            avatarUrl: m.user?.avatarUrl ?? null,
            assignedTasks: assignedMap.get(m.userId) ?? 0,
            completedTasks: completedMap.get(m.userId) ?? 0,
        }));

        // Add "Unassigned" entry
        workload.push({
            userId: null as unknown as string,
            name: 'Unassigned',
            avatarUrl: null,
            assignedTasks: assignedMap.get(null as unknown as string) ?? 0,
            completedTasks: completedMap.get(null as unknown as string) ?? 0,
        });

        return workload;
    }

    private async getCompletionTrend(
        projectId: string,
        filters: DashboardChartsFilterDto,
    ) {
        // Determine the time range: last 8 weeks by default
        const weeks = 8;
        const now = new Date();
        const points: Array<{
            date: string;
            completed: number;
            total: number;
            rate: number;
        }> = [];

        // Get the last column for "completed" determination
        const lastColumn = await this.columnRepo
            .createQueryBuilder('col')
            .where('col.project_id = :projectId', { projectId })
            .orderBy('col.position', 'DESC')
            .getOne();

        const lastColumnId = lastColumn?.id;

        for (let i = weeks - 1; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - i * 7);
            weekEnd.setHours(23, 59, 59, 999);

            const weekEndStr = weekEnd.toISOString();

            // Total tasks created on or before weekEnd
            const totalQb = this.taskRepo
                .createQueryBuilder('task')
                .where('task.project_id = :projectId', { projectId })
                .andWhere('task.deleted_at IS NULL')
                .andWhere('task.created_at <= :weekEnd', {
                    weekEnd: weekEndStr,
                });

            if (filters.assigneeId) {
                totalQb.andWhere('task.assignee_id = :assigneeId', {
                    assigneeId: filters.assigneeId,
                });
            }

            const total = await totalQb.getCount();

            // Completed tasks (in last column) created on or before weekEnd
            let completed = 0;
            if (lastColumnId) {
                const completedQb = this.taskRepo
                    .createQueryBuilder('task')
                    .where('task.project_id = :projectId', { projectId })
                    .andWhere('task.deleted_at IS NULL')
                    .andWhere('task.column_id = :lastColumnId', {
                        lastColumnId,
                    })
                    .andWhere('task.created_at <= :weekEnd', {
                        weekEnd: weekEndStr,
                    });

                if (filters.assigneeId) {
                    completedQb.andWhere('task.assignee_id = :assigneeId', {
                        assigneeId: filters.assigneeId,
                    });
                }

                completed = await completedQb.getCount();
            }

            const rate =
                total > 0
                    ? parseFloat(((completed / total) * 100).toFixed(2))
                    : 0.0;

            points.push({
                date: weekEnd.toISOString().split('T')[0],
                completed,
                total,
                rate,
            });
        }

        return points;
    }

    // ─── CSV Export ───────────────────────────────────────────────────

    async exportProjectCsv(
        userId: string,
        projectId: string,
    ): Promise<{ csv: string; filename: string }> {
        await this.validateOwnership(userId, projectId);

        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.projects.errors.not_found', {
                    id: projectId,
                }) || `Project with ID ${projectId} not found`,
            );
        }

        // Get all non-deleted tasks with relations
        const tasks = await this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.column', 'col')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.labels', 'label')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .orderBy('col.position', 'ASC')
            .addOrderBy('task.position', 'ASC')
            .getMany();

        // Get sub-task counts per task
        const subTaskCounts = await this.subTaskRepo
            .createQueryBuilder('st')
            .select('st.task_id', 'taskId')
            .addSelect('COUNT(st.id)', 'total')
            .addSelect(
                'SUM(CASE WHEN st.is_completed = true THEN 1 ELSE 0 END)',
                'completed',
            )
            .innerJoin('st.task', 'task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .groupBy('st.task_id')
            .getRawMany();

        const subTaskMap = new Map(
            subTaskCounts.map((r) => [
                r.taskId,
                {
                    completed: parseInt(r.completed, 10),
                    total: parseInt(r.total, 10),
                },
            ]),
        );

        // Get comment counts per task
        const commentCounts = await this.commentRepo
            .createQueryBuilder('c')
            .select('c.task_id', 'taskId')
            .addSelect('COUNT(c.id)', 'count')
            .innerJoin('c.task', 'task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .groupBy('c.task_id')
            .getRawMany();

        const commentMap = new Map(
            commentCounts.map((r) => [r.taskId, parseInt(r.count, 10)]),
        );

        // Get attachment counts per task
        const attachmentCounts = await this.attachmentRepo
            .createQueryBuilder('a')
            .select('a.task_id', 'taskId')
            .addSelect('COUNT(a.id)', 'count')
            .innerJoin('a.task', 'task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .groupBy('a.task_id')
            .getRawMany();

        const attachmentMap = new Map(
            attachmentCounts.map((r) => [r.taskId, parseInt(r.count, 10)]),
        );

        // Get time logged per task
        const timeCounts = await this.timeEntryRepo
            .createQueryBuilder('te')
            .select('te.task_id', 'taskId')
            .addSelect('COALESCE(SUM(te.duration_minutes), 0)', 'total')
            .innerJoin('te.task', 'task')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .groupBy('te.task_id')
            .getRawMany();

        const timeMap = new Map(
            timeCounts.map((r) => [r.taskId, parseInt(r.total, 10)]),
        );

        // Build CSV
        const header =
            'Title,Column,Assignee,Priority,Due Date,Labels,Sub-Tasks (completed/total),Time Logged (minutes),Comments Count,Attachments Count,Created';

        const rows = tasks.map((task) => {
            const subTasks = subTaskMap.get(task.id) ?? {
                completed: 0,
                total: 0,
            };
            const commentsCount = commentMap.get(task.id) ?? 0;
            const attachmentsCount = attachmentMap.get(task.id) ?? 0;
            const timeLogged = timeMap.get(task.id) ?? 0;

            return [
                this.escapeCsvField(task.title),
                this.escapeCsvField(task.column?.title ?? ''),
                this.escapeCsvField(
                    task.assignee?.fullName ?? task.assignee?.email ?? '',
                ),
                task.priority,
                task.dueDate
                    ? new Date(task.dueDate).toISOString().split('T')[0]
                    : '',
                this.escapeCsvField(
                    (task.labels ?? []).map((l) => l.name).join('; '),
                ),
                `${subTasks.completed}/${subTasks.total}`,
                timeLogged.toString(),
                commentsCount.toString(),
                attachmentsCount.toString(),
                task.createdAt
                    ? new Date(task.createdAt).toISOString().split('T')[0]
                    : '',
            ].join(',');
        });

        const csv = [header, ...rows].join('\n');

        // Generate filename
        const slug = project.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `project-${slug}-export-${dateStr}.csv`;

        return { csv, filename };
    }

    private escapeCsvField(value: string): string {
        if (
            value.includes(',') ||
            value.includes('"') ||
            value.includes('\n')
        ) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.projects.errors.not_found', {
                    id: projectId,
                }) || `Project with ID ${projectId} not found`,
            );
        }

        const member = await this.memberRepo.findOne({
            where: { projectId, userId },
        });

        if (!member) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.projects.errors.not_member') ||
                    'You are not a member of this project',
            );
        }

        return member;
    }

    private async validateOwnership(
        userId: string,
        projectId: string,
    ): Promise<void> {
        const member = await this.validateMembership(userId, projectId);

        if (member.projectRole !== ProjectRole.OWNER) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.projects.errors.not_owner') ||
                    'Only the project owner can perform this action',
            );
        }
    }
}
