import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Task } from './task.entity';
import { TaskFilterDto } from './dtos';

@Injectable()
export class TaskRepository extends BaseRepository<Task> {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) {
        super(taskRepository);
    }

    /**
     * Find tasks by project with filters, pagination, and relation loading.
     * Returns paginated tasks with assignee, labels, and subtask count info.
     */
    async findByProjectWithFilters(
        projectId: string,
        filters: TaskFilterDto,
    ): Promise<{ data: Task[]; total: number }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;
        const sortBy = filters.sortBy ?? 'position';
        const sortOrder = filters.sortOrder ?? 'ASC';

        const qb = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.labels', 'label')
            .leftJoinAndSelect('task.column', 'column')
            .leftJoinAndSelect('task.creator', 'creator')
            .loadRelationCountAndMap('task.subTaskCount', 'task.subTasks')
            .loadRelationCountAndMap('task.commentCount', 'task.comments')
            .loadRelationCountAndMap('task.attachmentCount', 'task.attachments')
            .where('task.projectId = :projectId', { projectId })
            .andWhere('task.deletedAt IS NULL');

        // Filter by priority
        if (filters.priority) {
            qb.andWhere('task.priority = :priority', {
                priority: filters.priority,
            });
        }

        // Filter by assignee
        if (filters.assigneeId) {
            qb.andWhere('task.assigneeId = :assigneeId', {
                assigneeId: filters.assigneeId,
            });
        }

        // Filter by label
        if (filters.labelId) {
            qb.andWhere((subQb) => {
                const subQuery = subQb
                    .subQuery()
                    .select('tl.task_id')
                    .from('task_labels', 'tl')
                    .where('tl.label_id = :labelId')
                    .getQuery();
                return `task.id IN ${subQuery}`;
            }).setParameter('labelId', filters.labelId);
        }

        // Search by title or description
        if (filters.search) {
            qb.andWhere(
                '(task.title ILIKE :search OR task.description ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        // Sorting
        const allowedSortColumns: Record<string, string> = {
            position: 'task.position',
            createdAt: 'task.createdAt',
            updatedAt: 'task.updatedAt',
            title: 'task.title',
            priority: 'task.priority',
            dueDate: 'task.dueDate',
        };
        const sortColumn = allowedSortColumns[sortBy] ?? 'task.position';
        qb.orderBy(sortColumn, sortOrder);

        const total = await qb.getCount();
        const data = await qb.skip(skip).take(limit).getMany();

        return { data, total };
    }

    /**
     * Find a single task with all detail relations loaded.
     */
    async findTaskWithDetails(taskId: string): Promise<Task | null> {
        return this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.creator', 'creator')
            .leftJoinAndSelect('task.labels', 'label')
            .leftJoinAndSelect('task.column', 'column')
            .leftJoinAndSelect('task.subTasks', 'subTask')
            .leftJoinAndSelect('task.comments', 'comment')
            .leftJoinAndSelect('comment.user', 'commentUser')
            .leftJoinAndSelect('task.attachments', 'attachment')
            .where('task.id = :taskId', { taskId })
            .andWhere('task.deletedAt IS NULL')
            .orderBy('subTask.position', 'ASC')
            .addOrderBy('comment.createdAt', 'ASC')
            .getOne();
    }

    /**
     * Get the maximum position value among tasks in a column.
     * Returns -1 if the column has no tasks, so new tasks get position 0.
     */
    async getMaxPositionInColumn(columnId: string): Promise<number> {
        const result = await this.taskRepository
            .createQueryBuilder('task')
            .select('MAX(task.position)', 'maxPos')
            .where('task.columnId = :columnId', { columnId })
            .andWhere('task.deletedAt IS NULL')
            .getRawOne();

        return result?.maxPos ?? -1;
    }

    /**
     * Find soft-deleted tasks for a project (trash).
     */
    async findTrashedByProject(projectId: string): Promise<Task[]> {
        return this.taskRepository
            .createQueryBuilder('task')
            .withDeleted()
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.column', 'column')
            .leftJoinAndSelect('task.deletedBy', 'deletedBy')
            .where('task.projectId = :projectId', { projectId })
            .andWhere('task.deletedAt IS NOT NULL')
            .orderBy('task.deletedAt', 'DESC')
            .getMany();
    }

    /**
     * Count non-deleted tasks in a column (for WIP limit checks).
     */
    async getTaskCountInColumn(columnId: string): Promise<number> {
        return this.taskRepository
            .createQueryBuilder('task')
            .where('task.columnId = :columnId', { columnId })
            .andWhere('task.deletedAt IS NULL')
            .getCount();
    }

    /**
     * Find tasks assigned to a user across all projects.
     */
    async findTasksByAssignee(userId: string): Promise<Task[]> {
        return this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.column', 'column')
            .leftJoinAndSelect('task.labels', 'label')
            .loadRelationCountAndMap('task.subTaskCount', 'task.subTasks')
            .where('task.assigneeId = :userId', { userId })
            .andWhere('task.deletedAt IS NULL')
            .andWhere('project.deletedAt IS NULL')
            .orderBy('task.dueDate', 'ASC', 'NULLS LAST')
            .addOrderBy('task.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Reposition tasks in a column after a task is removed or added.
     * Shifts positions for tasks at or after the given position.
     */
    async shiftPositionsUp(
        columnId: string,
        fromPosition: number,
    ): Promise<void> {
        await this.taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ position: () => 'position - 1' })
            .where('columnId = :columnId', { columnId })
            .andWhere('position > :fromPosition', { fromPosition })
            .andWhere('deletedAt IS NULL')
            .execute();
    }

    /**
     * Shift positions down to make room for a task at the given position.
     */
    async shiftPositionsDown(
        columnId: string,
        fromPosition: number,
    ): Promise<void> {
        await this.taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ position: () => 'position + 1' })
            .where('columnId = :columnId', { columnId })
            .andWhere('position >= :fromPosition', { fromPosition })
            .andWhere('deletedAt IS NULL')
            .execute();
    }

    /**
     * Find a soft-deleted task by ID (for restore / permanent delete).
     */
    async findTrashedById(taskId: string): Promise<Task | null> {
        return this.taskRepository
            .createQueryBuilder('task')
            .withDeleted()
            .where('task.id = :taskId', { taskId })
            .andWhere('task.deletedAt IS NOT NULL')
            .getOne();
    }

    /**
     * Restore a soft-deleted task.
     */
    async restoreTask(taskId: string): Promise<void> {
        await this.taskRepository.restore(taskId);
    }

    /**
     * Permanently delete a task (hard delete).
     */
    async permanentDelete(taskId: string): Promise<void> {
        await this.taskRepository
            .createQueryBuilder()
            .delete()
            .from(Task)
            .where('id = :taskId', { taskId })
            .execute();
    }
}
