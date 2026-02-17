import {
    Injectable,
    Logger,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';
import { User } from '@modules/users/user.entity';
import {
    BoardTemplate,
    NotificationType,
    ProjectRole,
    ProjectStatus,
} from '@shared/enums';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { MailService } from '@infrastructure/mail';
import { envConfigService } from 'src/config/env-config.service';
import {
    AdminProjectFilterDto,
    BulkProjectAction,
    BulkProjectActionDto,
    CreateAdminProjectDto,
} from './dtos';

/** Column definitions for each board template */
const TEMPLATE_COLUMNS: Record<BoardTemplate, string[]> = {
    [BoardTemplate.DEFAULT]: ['To Do', 'In Progress', 'Review', 'Done'],
    [BoardTemplate.MINIMAL]: ['To Do', 'Done'],
    [BoardTemplate.CUSTOM]: ['To Do', 'Done'],
};

@Injectable()
export class AdminProjectsService {
    private readonly logger = new Logger(AdminProjectsService.name);

    constructor(
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) {}

    /**
     * POST /admin/projects - Create a project on behalf of a user.
     * Runs inside a transaction for atomicity.
     */
    async createProject(dto: CreateAdminProjectDto) {
        // Validate owner exists
        const owner = await this.userRepo.findOne({
            where: { id: dto.ownerId },
        });
        if (!owner) {
            throw new NotFoundException('Owner user not found');
        }

        const template = dto.template ?? BoardTemplate.DEFAULT;
        const status = dto.status ?? ProjectStatus.ACTIVE;

        const result = await this.dataSource.transaction(async (manager) => {
            // 1. Create the project
            const project = manager.create(Project, {
                title: dto.title,
                description: dto.description ?? null,
                ownerId: dto.ownerId,
                template,
                deadline: dto.deadline ? new Date(dto.deadline) : null,
                status,
            });
            const savedProject = await manager.save(Project, project);

            // 2. Create default board columns based on template
            const columnTitles =
                TEMPLATE_COLUMNS[template] ??
                TEMPLATE_COLUMNS[BoardTemplate.DEFAULT];
            const columns = columnTitles.map((title, index) =>
                manager.create(BoardColumn, {
                    projectId: savedProject.id,
                    title,
                    position: index,
                }),
            );
            await manager.save(BoardColumn, columns);

            // 3. Add owner as OWNER member
            const member = manager.create(ProjectMember, {
                projectId: savedProject.id,
                userId: dto.ownerId,
                projectRole: ProjectRole.OWNER,
            });
            await manager.save(ProjectMember, member);

            // Return with relations
            return manager.findOne(Project, {
                where: { id: savedProject.id },
                relations: { owner: true, columns: true, members: true },
            });
        });

        // 4. Send notifications to owner (non-blocking, after transaction)
        if (dto.notifyTeam !== false && result) {
            // In-app notification
            try {
                await this.notificationsService.createNotification(
                    owner.id,
                    NotificationType.PROJECT_CREATED,
                    'New Project',
                    `You've been assigned as owner of "${dto.title}"`,
                    undefined,
                    result.id,
                );
            } catch (error) {
                this.logger.warn(
                    `Failed to create project notification: ${(error as Error).message}`,
                );
            }

            // Email notification
            try {
                const frontendUrl = envConfigService.getFrontendUrl();
                const projectUrl = `${frontendUrl}/projects/${result.id}/board`;
                await this.mailService.sendProjectCreatedEmail(
                    owner.email,
                    dto.title,
                    projectUrl,
                    dto.description,
                );
            } catch (error) {
                this.logger.warn(
                    `Failed to send project created email: ${(error as Error).message}`,
                );
            }
        }

        return result;
    }

    /**
     * GET /admin/projects - List projects with filtering, sorting, pagination
     */
    async getProjects(filter: AdminProjectFilterDto) {
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const offset = (page - 1) * limit;

        const qb = this.projectRepo
            .createQueryBuilder('p')
            .leftJoin('p.owner', 'owner')
            .addSelect(['owner.id', 'owner.fullName', 'owner.email'])
            .loadRelationCountAndMap('p.membersCount', 'p.members')
            .loadRelationCountAndMap('p.tasksCount', 'p.tasks', 'task', (qb) =>
                qb.where('task.deletedAt IS NULL'),
            )
            .where('p.deletedAt IS NULL');

        // Search filter
        if (filter.search) {
            qb.andWhere(
                '(p.title ILIKE :search OR owner.fullName ILIKE :search)',
                { search: `%${filter.search}%` },
            );
        }

        // Status filter
        if (filter.status) {
            qb.andWhere('p.status = :status', { status: filter.status });
        }

        // Date range filter
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

        // Sorting
        const sortBy = filter.sortBy || 'created_at';
        const sortOrder = filter.sortOrder || 'DESC';

        switch (sortBy) {
            case 'title':
                qb.orderBy('p.title', sortOrder);
                break;
            case 'owner_name':
                qb.orderBy('owner.fullName', sortOrder);
                break;
            case 'status':
                qb.orderBy('p.status', sortOrder);
                break;
            case 'deadline':
                qb.orderBy('p.deadline', sortOrder);
                break;
            case 'created_at':
            default:
                qb.orderBy('p.createdAt', sortOrder);
                break;
            // members_count, tasks_count, completion_percent need post-processing
            // For these, we fall back to created_at and handle in memory after fetch
            case 'members_count':
            case 'tasks_count':
            case 'completion_percent':
                // Will sort in memory after fetching computed fields
                qb.orderBy('p.createdAt', 'DESC');
                break;
        }

        // Get total count
        const total = await qb.getCount();

        // Get paginated results
        qb.skip(offset).take(limit);
        const projects = await qb.getMany();

        // Compute completion percent for each project
        const projectIds = projects.map((p) => p.id);
        const completionMap = await this.computeCompletionPercent(projectIds);

        // Filter by membersMin/membersMax if provided
        // Note: Since we use loadRelationCountAndMap, the count is on the entity
        let results = projects.map((p) => {
            const membersCount = (p as any).membersCount || 0;
            const tasksCount = (p as any).tasksCount || 0;
            const completionPercent = completionMap.get(p.id) || 0;

            return {
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.status,
                deadline: p.deadline,
                createdAt: p.createdAt,
                owner: p.owner
                    ? {
                          id: p.owner.id,
                          name: p.owner.fullName,
                          email: p.owner.email,
                      }
                    : null,
                membersCount,
                tasksCount,
                completionPercent,
            };
        });

        // Post-filter by membersMin/membersMax
        if (filter.membersMin !== undefined) {
            results = results.filter(
                (r) => r.membersCount >= filter.membersMin!,
            );
        }
        if (filter.membersMax !== undefined) {
            results = results.filter(
                (r) => r.membersCount <= filter.membersMax!,
            );
        }

        // In-memory sort for computed fields
        if (
            ['members_count', 'tasks_count', 'completion_percent'].includes(
                sortBy,
            )
        ) {
            const fieldMap: Record<string, string> = {
                members_count: 'membersCount',
                tasks_count: 'tasksCount',
                completion_percent: 'completionPercent',
            };
            const field = fieldMap[sortBy] as keyof (typeof results)[0];
            results.sort((a, b) => {
                const aVal = a[field] as number;
                const bVal = b[field] as number;
                return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
            });
        }

        return { data: results, page, limit, total };
    }

    /**
     * Compute completion percentage for a list of project IDs.
     * A task is "completed" if it's in the last column (highest position) of its project.
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

    /**
     * GET /admin/projects/:projectId - Detailed project view
     */
    async getProjectDetail(projectId: string) {
        const project = await this.projectRepo
            .createQueryBuilder('p')
            .leftJoin('p.owner', 'owner')
            .addSelect(['owner.id', 'owner.fullName', 'owner.email'])
            .where('p.id = :projectId', { projectId })
            .andWhere('p.deletedAt IS NULL')
            .getOne();

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Get members
        const members = await this.memberRepo
            .createQueryBuilder('pm')
            .leftJoin('pm.user', 'u')
            .addSelect(['u.id', 'u.fullName', 'u.email', 'u.avatarUrl'])
            .where('pm.projectId = :projectId', { projectId })
            .getMany();

        // Get columns with task counts
        const columns = await this.columnRepo
            .createQueryBuilder('c')
            .loadRelationCountAndMap('c.taskCount', 'c.tasks', 'task', (qb) =>
                qb.where('task.deletedAt IS NULL'),
            )
            .where('c.projectId = :projectId', { projectId })
            .orderBy('c.position', 'ASC')
            .getMany();

        // Task summary
        const totalTasks = await this.taskRepo
            .createQueryBuilder('t')
            .where('t.projectId = :projectId', { projectId })
            .andWhere('t.deletedAt IS NULL')
            .getCount();

        const overdueCount = await this.taskRepo
            .createQueryBuilder('t')
            .where('t.projectId = :projectId', { projectId })
            .andWhere('t.deletedAt IS NULL')
            .andWhere('t.dueDate < :now', { now: new Date() })
            .getCount();

        const byStatus = columns.map((c) => ({
            column: c.title,
            count: (c as any).taskCount || 0,
        }));

        // Recent activity (5 latest)
        const recentActivity = await this.activityLogRepo
            .createQueryBuilder('al')
            .leftJoin('al.user', 'u')
            .addSelect(['u.id', 'u.fullName'])
            .where('al.projectId = :projectId', { projectId })
            .orderBy('al.createdAt', 'DESC')
            .limit(5)
            .getMany();

        return {
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            deadline: project.deadline,
            createdAt: project.createdAt,
            owner: project.owner
                ? {
                      id: project.owner.id,
                      name: project.owner.fullName,
                      email: project.owner.email,
                  }
                : null,
            members: members.map((pm) => ({
                id: pm.user?.id,
                name: pm.user?.fullName,
                email: pm.user?.email,
                avatarUrl: pm.user?.avatarUrl || null,
                projectRole: pm.projectRole,
                joinedAt: pm.joinedAt,
            })),
            taskSummary: {
                total: totalTasks,
                byStatus,
                overdueCount,
            },
            recentActivity: recentActivity.map((al) => ({
                id: al.id,
                action: al.action,
                user: al.user
                    ? { id: al.user.id, name: al.user.fullName }
                    : null,
                details: al.details,
                createdAt: al.createdAt,
            })),
        };
    }

    /**
     * POST /admin/projects/:projectId/archive
     */
    async archiveProject(projectId: string) {
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.status === ProjectStatus.ARCHIVED) {
            throw new UnprocessableEntityException(
                'Project is already archived',
            );
        }

        project.status = ProjectStatus.ARCHIVED;
        await this.projectRepo.save(project);

        return { id: project.id, status: project.status };
    }

    /**
     * DELETE /admin/projects/:projectId - Soft delete
     */
    async deleteProject(projectId: string) {
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        await this.projectRepo.softRemove(project);
    }

    /**
     * POST /admin/projects/bulk - Bulk archive or delete
     */
    async bulkAction(dto: BulkProjectActionDto) {
        const success: string[] = [];
        const failed: string[] = [];
        const errors: Array<{ projectId: string; message: string }> = [];

        for (const projectId of dto.projectIds) {
            try {
                if (dto.action === BulkProjectAction.ARCHIVE) {
                    await this.archiveProject(projectId);
                } else if (dto.action === BulkProjectAction.DELETE) {
                    await this.deleteProject(projectId);
                }
                success.push(projectId);
            } catch (err: any) {
                failed.push(projectId);
                errors.push({
                    projectId,
                    message: err.message || 'Unknown error',
                });
            }
        }

        return { success, failed, errors };
    }

    /**
     * GET /admin/projects/export - CSV export with same filters as list
     */
    async getProjectsForExport(filter: AdminProjectFilterDto) {
        // Override pagination for export: max 10,000 rows
        const exportFilter = { ...filter, page: 1, limit: 10000 };
        const result = await this.getProjects(exportFilter);
        return result.data;
    }
}
