import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Project } from './project.entity';
import { ProjectRole } from '@shared/enums';
import { CalendarFilterDto, RescheduleTaskDto } from './dtos';

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        private readonly i18nHelper: I18nHelper,
    ) {}

    // ─── Calendar Tasks ───────────────────────────────────────────────

    async getCalendarTasks(
        userId: string,
        projectId: string,
        filters: CalendarFilterDto,
    ) {
        await this.validateMembership(userId, projectId);

        const now = new Date();
        const month = filters.month ?? now.getMonth() + 1;
        const year = filters.year ?? now.getFullYear();

        // Calculate start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const tasks = await this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.column', 'col')
            .leftJoinAndSelect('task.labels', 'label')
            .where('task.project_id = :projectId', { projectId })
            .andWhere('task.deleted_at IS NULL')
            .andWhere('task.due_date >= :startDate', { startDate: startStr })
            .andWhere('task.due_date <= :endDate', { endDate: endStr })
            .orderBy('task.due_date', 'ASC')
            .addOrderBy(
                `CASE task.priority
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                    ELSE 5
                END`,
                'ASC',
            )
            .getMany();

        const data = tasks.map((task) => ({
            id: task.id,
            title: task.title,
            dueDate: task.dueDate
                ? new Date(task.dueDate).toISOString().split('T')[0]
                : null,
            priority: task.priority,
            assignee: task.assignee
                ? {
                      id: task.assignee.id,
                      name: task.assignee.fullName ?? task.assignee.email,
                      avatarUrl: task.assignee.avatarUrl ?? null,
                  }
                : null,
            columnTitle: task.column?.title ?? '',
            labels: (task.labels ?? []).map((l) => ({
                id: l.id,
                name: l.name,
                color: l.color,
            })),
        }));

        return { data, month, year };
    }

    // ─── Reschedule Task ──────────────────────────────────────────────

    async rescheduleTask(
        userId: string,
        projectId: string,
        taskId: string,
        dto: RescheduleTaskDto,
    ) {
        await this.validateOwnership(userId, projectId);

        // Validate task belongs to project
        const task = await this.taskRepo.findOne({
            where: { id: taskId, projectId },
            relations: { assignee: true, column: true },
        });

        if (!task) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.tasks.errors.not_found', {
                    id: taskId,
                }) || `Task with ID ${taskId} not found in this project`,
            );
        }

        // Update dueDate
        task.dueDate = new Date(dto.dueDate);
        const saved = await this.taskRepo.save(task);

        return {
            id: saved.id,
            title: saved.title,
            dueDate: saved.dueDate
                ? new Date(saved.dueDate).toISOString().split('T')[0]
                : null,
            priority: saved.priority,
            assignee: saved.assignee
                ? {
                      id: saved.assignee.id,
                      name: saved.assignee.fullName ?? saved.assignee.email,
                      avatarUrl: saved.assignee.avatarUrl ?? null,
                  }
                : null,
            columnTitle: saved.column?.title ?? '',
            updatedAt: saved.updatedAt,
        };
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
