import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Task } from './task.entity';
import { TaskRepository } from './task.repository';
import {
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    TaskFilterDto,
} from './dtos';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { Label } from '@modules/labels/label.entity';
import { ProjectRole } from '@shared/enums';

@Injectable()
export class TasksService extends BaseService<Task> {
    constructor(
        private readonly taskRepository: TaskRepository,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
        @InjectRepository(Label)
        private readonly labelRepo: Repository<Label>,
        private readonly dataSource: DataSource,
        private readonly i18nHelper: I18nHelper,
    ) {
        super(taskRepository, 'Task');
    }

    // ─── Public Methods ──────────────────────────────────────────────

    /**
     * List tasks in a project with filters and pagination.
     */
    async getTasks(
        userId: string,
        projectId: string,
        filters: TaskFilterDto,
    ): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
        await this.validateMembership(userId, projectId);

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const result = await this.taskRepository.findByProjectWithFilters(
            projectId,
            filters,
        );

        return {
            data: result.data,
            total: result.total,
            page,
            limit,
        };
    }

    /**
     * Create a new task in a project.
     * Validates membership, column ownership, auto-sets position, and attaches labels.
     */
    async createTask(
        userId: string,
        projectId: string,
        dto: CreateTaskDto,
    ): Promise<Task> {
        await this.validateMembership(userId, projectId);

        // Validate that the column belongs to this project
        const column = await this.columnRepo.findOne({
            where: { id: dto.columnId, projectId },
        });
        if (!column) {
            throw new BadRequestException(
                this.i18nHelper.t(
                    'translation.tasks.errors.column_not_in_project',
                ) || 'The specified column does not belong to this project',
            );
        }

        // Check WIP limit on target column
        await this.checkWipLimit(column);

        // Auto-set position to end of column
        const maxPosition = await this.taskRepository.getMaxPositionInColumn(
            dto.columnId,
        );
        const newPosition = maxPosition + 1;

        // Resolve labels if provided
        let labels: Label[] = [];
        if (dto.labelIds && dto.labelIds.length > 0) {
            labels = await this.labelRepo.find({
                where: { id: In(dto.labelIds) },
            });
        }

        // Create the task
        return this.dataSource.transaction(async (manager) => {
            const task = manager.create(Task, {
                projectId,
                columnId: dto.columnId,
                creatorId: userId,
                assigneeId: dto.assigneeId ?? null,
                title: dto.title,
                description: dto.description ?? null,
                priority: dto.priority,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                position: newPosition,
                labels,
            });

            const savedTask = await manager.save(Task, task);

            // Return with relations loaded
            return manager.findOne(Task, {
                where: { id: savedTask.id },
                relations: {
                    assignee: true,
                    creator: true,
                    labels: true,
                    column: true,
                },
            }) as Promise<Task>;
        });
    }

    /**
     * Get a single task by ID with full details.
     */
    async getTaskById(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<Task> {
        await this.validateMembership(userId, projectId);

        const task = await this.taskRepository.findTaskWithDetails(taskId);

        if (!task || task.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.tasks.errors.not_found', {
                    id: taskId,
                }) || `Task with ID ${taskId} not found`,
            );
        }

        return task;
    }

    /**
     * Update a task.
     * Owner can edit any task; member can edit only tasks they created or are assigned to.
     */
    async updateTask(
        userId: string,
        projectId: string,
        taskId: string,
        dto: UpdateTaskDto,
    ): Promise<Task> {
        const member = await this.validateMembership(userId, projectId);

        const task = await this.taskRepository.findTaskWithDetails(taskId);
        if (!task || task.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.tasks.errors.not_found', {
                    id: taskId,
                }) || `Task with ID ${taskId} not found`,
            );
        }

        // Permission check: owner can edit any task, member can edit own tasks
        if (member.projectRole !== ProjectRole.OWNER) {
            if (task.creatorId !== userId && task.assigneeId !== userId) {
                throw new ForbiddenException(
                    this.i18nHelper.t(
                        'translation.tasks.errors.not_authorized',
                    ) ||
                        'You can only edit tasks you created or are assigned to',
                );
            }
        }

        return this.dataSource.transaction(async (manager) => {
            // Build update data
            const updateData: Partial<Task> = {};
            if (dto.title !== undefined) updateData.title = dto.title;
            if (dto.description !== undefined)
                updateData.description = dto.description ?? null;
            if (dto.priority !== undefined) updateData.priority = dto.priority;
            if (dto.assigneeId !== undefined)
                updateData.assigneeId = dto.assigneeId ?? null;
            if (dto.dueDate !== undefined)
                updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

            // Update scalar fields
            if (Object.keys(updateData).length > 0) {
                await manager.update(Task, taskId, updateData);
            }

            // Sync labels if provided
            if (dto.labelIds !== undefined) {
                const labels =
                    dto.labelIds.length > 0
                        ? await this.labelRepo.find({
                              where: { id: In(dto.labelIds) },
                          })
                        : [];

                // Use query builder to sync the many-to-many relation
                const taskEntity = await manager.findOne(Task, {
                    where: { id: taskId },
                    relations: { labels: true },
                });

                if (taskEntity) {
                    taskEntity.labels = labels;
                    await manager.save(Task, taskEntity);
                }
            }

            // Return updated task with full details
            return manager.findOne(Task, {
                where: { id: taskId },
                relations: {
                    assignee: true,
                    creator: true,
                    labels: true,
                    column: true,
                    subTasks: true,
                },
            }) as Promise<Task>;
        });
    }

    /**
     * Move a task to a different column and/or position.
     * Any member can move tasks. Checks WIP limit on target column.
     * Runs in a transaction to maintain position consistency.
     */
    async moveTask(
        userId: string,
        projectId: string,
        taskId: string,
        dto: MoveTaskDto,
    ): Promise<Task> {
        await this.validateMembership(userId, projectId);

        const task = await this.taskRepository.findById(taskId);
        if (!task || task.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.tasks.errors.not_found', {
                    id: taskId,
                }) || `Task with ID ${taskId} not found`,
            );
        }

        // Validate target column belongs to the project
        const targetColumn = await this.columnRepo.findOne({
            where: { id: dto.columnId, projectId },
        });
        if (!targetColumn) {
            throw new BadRequestException(
                this.i18nHelper.t(
                    'translation.tasks.errors.column_not_in_project',
                ) || 'The specified column does not belong to this project',
            );
        }

        const sourceColumnId = task.columnId;
        const sourcePosition = task.position;
        const targetColumnId = dto.columnId;
        const targetPosition = dto.position;

        // Check WIP limit on target column (only if moving to a different column)
        if (sourceColumnId !== targetColumnId) {
            await this.checkWipLimit(targetColumn);
        }

        return this.dataSource.transaction(async (manager) => {
            if (sourceColumnId === targetColumnId) {
                // Moving within the same column - reorder
                if (sourcePosition < targetPosition) {
                    // Moving down: shift tasks between old and new position up
                    await manager
                        .createQueryBuilder()
                        .update(Task)
                        .set({ position: () => 'position - 1' })
                        .where('columnId = :columnId', {
                            columnId: sourceColumnId,
                        })
                        .andWhere('position > :sourcePos', {
                            sourcePos: sourcePosition,
                        })
                        .andWhere('position <= :targetPos', {
                            targetPos: targetPosition,
                        })
                        .andWhere('deletedAt IS NULL')
                        .andWhere('id != :taskId', { taskId })
                        .execute();
                } else if (sourcePosition > targetPosition) {
                    // Moving up: shift tasks between new and old position down
                    await manager
                        .createQueryBuilder()
                        .update(Task)
                        .set({ position: () => 'position + 1' })
                        .where('columnId = :columnId', {
                            columnId: sourceColumnId,
                        })
                        .andWhere('position >= :targetPos', {
                            targetPos: targetPosition,
                        })
                        .andWhere('position < :sourcePos', {
                            sourcePos: sourcePosition,
                        })
                        .andWhere('deletedAt IS NULL')
                        .andWhere('id != :taskId', { taskId })
                        .execute();
                }
            } else {
                // Moving to a different column

                // Close the gap in the source column
                await manager
                    .createQueryBuilder()
                    .update(Task)
                    .set({ position: () => 'position - 1' })
                    .where('columnId = :columnId', {
                        columnId: sourceColumnId,
                    })
                    .andWhere('position > :sourcePos', {
                        sourcePos: sourcePosition,
                    })
                    .andWhere('deletedAt IS NULL')
                    .execute();

                // Make room in the target column
                await manager
                    .createQueryBuilder()
                    .update(Task)
                    .set({ position: () => 'position + 1' })
                    .where('columnId = :columnId', {
                        columnId: targetColumnId,
                    })
                    .andWhere('position >= :targetPos', {
                        targetPos: targetPosition,
                    })
                    .andWhere('deletedAt IS NULL')
                    .execute();
            }

            // Place the task at the target position and column
            await manager.update(Task, taskId, {
                columnId: targetColumnId,
                position: targetPosition,
            });

            return manager.findOne(Task, {
                where: { id: taskId },
                relations: {
                    assignee: true,
                    creator: true,
                    labels: true,
                    column: true,
                },
            }) as Promise<Task>;
        });
    }

    /**
     * Soft-delete a task. Owner-only.
     * Records who deleted the task.
     */
    async deleteTask(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<void> {
        await this.validateOwnership(userId, projectId);

        const task = await this.taskRepository.findById(taskId);
        if (!task || task.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.tasks.errors.not_found', {
                    id: taskId,
                }) || `Task with ID ${taskId} not found`,
            );
        }

        return this.dataSource.transaction(async (manager) => {
            // Record who deleted the task
            await manager.update(Task, taskId, { deletedById: userId });

            // Soft delete
            await manager.softDelete(Task, taskId);

            // Close the gap in the column
            await this.taskRepository.shiftPositionsUp(
                task.columnId,
                task.position,
            );
        });
    }

    /**
     * List soft-deleted (trashed) tasks in a project. Owner-only.
     */
    async getTrashedTasks(userId: string, projectId: string): Promise<Task[]> {
        await this.validateOwnership(userId, projectId);

        return this.taskRepository.findTrashedByProject(projectId);
    }

    /**
     * Restore a soft-deleted task. Owner-only.
     * Restores to the end of its original column.
     */
    async restoreTask(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<Task> {
        await this.validateOwnership(userId, projectId);

        const trashedTask = await this.taskRepository.findTrashedById(taskId);
        if (!trashedTask || trashedTask.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t(
                    'translation.tasks.errors.not_found_in_trash',
                    {
                        id: taskId,
                    },
                ) || `Task with ID ${taskId} not found in trash`,
            );
        }

        // Get new position at end of its column
        const maxPosition = await this.taskRepository.getMaxPositionInColumn(
            trashedTask.columnId,
        );

        return this.dataSource.transaction(async (manager) => {
            // Restore the task
            await manager.restore(Task, taskId);

            // Clear deletedById and set new position
            await manager.update(Task, taskId, {
                deletedById: null,
                position: maxPosition + 1,
            });

            return manager.findOne(Task, {
                where: { id: taskId },
                relations: {
                    assignee: true,
                    creator: true,
                    labels: true,
                    column: true,
                },
            }) as Promise<Task>;
        });
    }

    /**
     * Permanently delete a task. Owner-only.
     */
    async permanentDeleteTask(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<void> {
        await this.validateOwnership(userId, projectId);

        const trashedTask = await this.taskRepository.findTrashedById(taskId);
        if (!trashedTask || trashedTask.projectId !== projectId) {
            throw new NotFoundException(
                this.i18nHelper.t(
                    'translation.tasks.errors.not_found_in_trash',
                    {
                        id: taskId,
                    },
                ) || `Task with ID ${taskId} not found in trash`,
            );
        }

        await this.taskRepository.permanentDelete(taskId);
    }

    /**
     * Get all tasks assigned to the current user across all projects.
     */
    async getMyTasks(userId: string): Promise<Task[]> {
        return this.taskRepository.findTasksByAssignee(userId);
    }

    // ─── Private Helpers ─────────────────────────────────────────────

    /**
     * Validate that the user is a member of the project.
     * Throws NotFoundException if project not found, ForbiddenException if not a member.
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
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

    /**
     * Validate that the user is the owner of the project.
     * Throws ForbiddenException if not the owner.
     */
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

    /**
     * Check the WIP limit on a column before adding a task.
     * Throws BadRequestException if the column is at its WIP limit.
     */
    private async checkWipLimit(column: BoardColumn): Promise<void> {
        if (column.wipLimit !== null && column.wipLimit > 0) {
            const currentCount = await this.taskRepository.getTaskCountInColumn(
                column.id,
            );
            if (currentCount >= column.wipLimit) {
                throw new BadRequestException(
                    this.i18nHelper.t(
                        'translation.tasks.errors.wip_limit_reached',
                        {
                            column: column.title,
                            limit: String(column.wipLimit),
                        },
                    ) ||
                        `Column "${column.title}" has reached its WIP limit of ${column.wipLimit}`,
                );
            }
        }
    }
}
