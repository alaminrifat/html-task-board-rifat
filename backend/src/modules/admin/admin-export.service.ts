import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/users/user.entity';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { UserStatus } from '@shared/enums';
import { AdminExportFilterDto } from './dtos/admin-export-filter.dto';
import { AdminProjectExportFilterDto } from './dtos/admin-project-export-filter.dto';
import { AdminTaskExportFilterDto } from './dtos/admin-task-export-filter.dto';

@Injectable()
export class AdminExportService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepo: Repository<TimeEntry>,
    ) {}

    /**
     * Escape a CSV field value.
     */
    private escapeCsvField(value: unknown): string {
        if (value === null || value === undefined) return '';
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        if (
            str.includes(',') ||
            str.includes('"') ||
            str.includes('\n') ||
            str.includes('\r')
        ) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    /**
     * Build a CSV string from headers and rows.
     */
    private buildCsv(headers: string[], rows: unknown[][]): string {
        const headerLine = headers.map((h) => this.escapeCsvField(h)).join(',');
        const dataLines = rows.map((row) =>
            row.map((cell) => this.escapeCsvField(cell)).join(','),
        );
        return [headerLine, ...dataLines].join('\r\n');
    }

    /**
     * Export users as CSV.
     * CSV: Name,Email,Role,Status,Projects Count,Tasks Count,Registration Date,Last Active
     */
    async generateUsersCsv(filter: AdminExportFilterDto): Promise<string> {
        const qb = this.userRepo
            .createQueryBuilder('u')
            .select([
                'u.id',
                'u.fullName',
                'u.email',
                'u.role',
                'u.status',
                'u.createdAt',
                'u.lastActiveAt',
            ]);

        // Exclude soft-deleted unless filtering for DELETED status
        if (filter.status !== UserStatus.DELETED) {
            qb.where('u.status != :deleted', { deleted: UserStatus.DELETED });
        }

        if (filter.role) {
            qb.andWhere('u.role = :role', { role: filter.role });
        }

        if (filter.status) {
            qb.andWhere('u.status = :status', { status: filter.status });
        }

        if (filter.dateFrom) {
            qb.andWhere('u.createdAt >= :dateFrom', {
                dateFrom: new Date(filter.dateFrom + 'T00:00:00.000Z'),
            });
        }

        if (filter.dateTo) {
            qb.andWhere('u.createdAt <= :dateTo', {
                dateTo: new Date(filter.dateTo + 'T23:59:59.999Z'),
            });
        }

        qb.orderBy('u.createdAt', 'DESC').take(10000);

        const users = await qb.getMany();

        // Get project counts and task counts for each user
        const userIds = users.map((u) => u.id);

        const projectCountMap = new Map<string, number>();
        const taskCountMap = new Map<string, number>();

        if (userIds.length > 0) {
            const projectCounts = await this.memberRepo
                .createQueryBuilder('pm')
                .select('pm.user_id', 'userId')
                .addSelect('COUNT(DISTINCT pm.project_id)', 'count')
                .where('pm.user_id IN (:...userIds)', { userIds })
                .groupBy('pm.user_id')
                .getRawMany();

            for (const row of projectCounts) {
                projectCountMap.set(row.userId, Number(row.count));
            }

            const taskCounts = await this.taskRepo
                .createQueryBuilder('t')
                .select('t.assignee_id', 'userId')
                .addSelect('COUNT(*)', 'count')
                .where('t.assignee_id IN (:...userIds)', { userIds })
                .andWhere('t.deletedAt IS NULL')
                .groupBy('t.assignee_id')
                .getRawMany();

            for (const row of taskCounts) {
                taskCountMap.set(row.userId, Number(row.count));
            }
        }

        const headers = [
            'Name',
            'Email',
            'Role',
            'Status',
            'Projects Count',
            'Tasks Count',
            'Registration Date',
            'Last Active',
        ];

        const rows = users.map((u) => [
            u.fullName || '',
            u.email,
            u.role,
            u.status,
            projectCountMap.get(u.id) || 0,
            taskCountMap.get(u.id) || 0,
            u.createdAt
                ? new Date(u.createdAt).toISOString().split('T')[0]
                : '',
            u.lastActiveAt
                ? new Date(u.lastActiveAt).toISOString().split('T')[0]
                : '',
        ]);

        return this.buildCsv(headers, rows);
    }

    /**
     * Export projects as CSV.
     * CSV: Title,Owner,Owner Email,Status,Members Count,Tasks Count,Completion %,Created,Deadline
     */
    async generateProjectsCsv(
        filter: AdminProjectExportFilterDto,
    ): Promise<string> {
        const qb = this.projectRepo
            .createQueryBuilder('p')
            .leftJoin('p.owner', 'owner')
            .addSelect(['owner.id', 'owner.fullName', 'owner.email'])
            .loadRelationCountAndMap('p.membersCount', 'p.members')
            .loadRelationCountAndMap('p.tasksCount', 'p.tasks', 'task', (qb) =>
                qb.where('task.deletedAt IS NULL'),
            )
            .where('p.deletedAt IS NULL');

        if (filter.status) {
            qb.andWhere('p.status = :status', { status: filter.status });
        }

        if (filter.dateFrom) {
            qb.andWhere('p.createdAt >= :dateFrom', {
                dateFrom: new Date(filter.dateFrom + 'T00:00:00.000Z'),
            });
        }

        if (filter.dateTo) {
            qb.andWhere('p.createdAt <= :dateTo', {
                dateTo: new Date(filter.dateTo + 'T23:59:59.999Z'),
            });
        }

        qb.orderBy('p.createdAt', 'DESC').take(10000);

        const projects = await qb.getMany();

        // Compute completion percentages
        const projectIds = projects.map((p) => p.id);
        const completionMap = await this.computeCompletionPercent(projectIds);

        const headers = [
            'Title',
            'Owner',
            'Owner Email',
            'Status',
            'Members Count',
            'Tasks Count',
            'Completion %',
            'Created',
            'Deadline',
        ];

        const rows = projects.map((p) => [
            p.title,
            p.owner?.fullName || '',
            p.owner?.email || '',
            p.status,
            (p as any).membersCount || 0,
            (p as any).tasksCount || 0,
            completionMap.get(p.id) || 0,
            p.createdAt
                ? new Date(p.createdAt).toISOString().split('T')[0]
                : '',
            p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
        ]);

        return this.buildCsv(headers, rows);
    }

    /**
     * Export tasks as CSV.
     * CSV: Title,Project,Column,Assignee,Assignee Email,Priority,Due Date,Time Logged (minutes),Created
     */
    async generateTasksCsv(filter: AdminTaskExportFilterDto): Promise<string> {
        const qb = this.taskRepo
            .createQueryBuilder('t')
            .leftJoin('t.project', 'p')
            .leftJoin('t.column', 'col')
            .leftJoin('t.assignee', 'assignee')
            .addSelect(['p.id', 'p.title'])
            .addSelect(['col.id', 'col.title'])
            .addSelect(['assignee.id', 'assignee.fullName', 'assignee.email'])
            .where('t.deletedAt IS NULL')
            .andWhere('p.deletedAt IS NULL');

        if (filter.projectId) {
            qb.andWhere('t.projectId = :projectId', {
                projectId: filter.projectId,
            });
        }

        if (filter.status) {
            qb.andWhere('col.title ILIKE :colTitle', {
                colTitle: `%${filter.status}%`,
            });
        }

        if (filter.priority) {
            qb.andWhere('t.priority = :priority', {
                priority: filter.priority,
            });
        }

        if (filter.dateFrom) {
            qb.andWhere('t.createdAt >= :dateFrom', {
                dateFrom: new Date(filter.dateFrom + 'T00:00:00.000Z'),
            });
        }

        if (filter.dateTo) {
            qb.andWhere('t.createdAt <= :dateTo', {
                dateTo: new Date(filter.dateTo + 'T23:59:59.999Z'),
            });
        }

        qb.orderBy('t.createdAt', 'DESC').take(10000);

        const tasks = await qb.getMany();

        // Get time logged per task
        const taskIds = tasks.map((t) => t.id);
        const timeMap = new Map<string, number>();

        if (taskIds.length > 0) {
            const timeLogs = await this.timeEntryRepo
                .createQueryBuilder('te')
                .select('te.task_id', 'taskId')
                .addSelect('SUM(te.duration_minutes)', 'totalMinutes')
                .where('te.task_id IN (:...taskIds)', { taskIds })
                .groupBy('te.task_id')
                .getRawMany();

            for (const row of timeLogs) {
                timeMap.set(row.taskId, Number(row.totalMinutes) || 0);
            }
        }

        const headers = [
            'Title',
            'Project',
            'Column',
            'Assignee',
            'Assignee Email',
            'Priority',
            'Due Date',
            'Time Logged (minutes)',
            'Created',
        ];

        const rows = tasks.map((t) => [
            t.title,
            t.project?.title || '',
            t.column?.title || '',
            t.assignee?.fullName || '',
            t.assignee?.email || '',
            t.priority,
            t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
            timeMap.get(t.id) || 0,
            t.createdAt
                ? new Date(t.createdAt).toISOString().split('T')[0]
                : '',
        ]);

        return this.buildCsv(headers, rows);
    }

    /**
     * Compute completion percentage for a list of project IDs.
     */
    private async computeCompletionPercent(
        projectIds: string[],
    ): Promise<Map<string, number>> {
        const map = new Map<string, number>();
        if (projectIds.length === 0) return map;

        const rawData = await this.taskRepo
            .createQueryBuilder('t')
            .select('t.project_id', 'projectId')
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
            .where('t.project_id IN (:...projectIds)', { projectIds })
            .andWhere('t.deletedAt IS NULL')
            .groupBy('t.project_id')
            .getRawMany();

        for (const row of rawData) {
            const total = Number(row.total);
            const completed = Number(row.completed);
            map.set(
                row.projectId,
                total > 0
                    ? Math.round((completed / total) * 100 * 100) / 100
                    : 0,
            );
        }

        return map;
    }
}
