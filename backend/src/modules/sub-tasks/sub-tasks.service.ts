import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { SubTask } from './sub-task.entity';
import { SubTaskRepository } from './sub-task.repository';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTasksDto } from './dtos';

@Injectable()
export class SubTasksService extends BaseService<SubTask> {
    constructor(
        private readonly subTaskRepository: SubTaskRepository,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepo: Repository<ProjectMember>,
        private readonly dataSource: DataSource,
    ) {
        super(subTaskRepository, 'SubTask');
    }

    /**
     * List all subtasks for a task, ordered by position.
     * Validates that the requesting user is a member of the project.
     */
    async getSubTasks(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<SubTask[]> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskBelongsToProject(taskId, projectId);
        return this.subTaskRepository.findByTask(taskId);
    }

    /**
     * Create a new subtask for a task.
     * Auto-assigns position as max + 1.
     */
    async createSubTask(
        userId: string,
        projectId: string,
        taskId: string,
        dto: CreateSubTaskDto,
    ): Promise<SubTask> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskBelongsToProject(taskId, projectId);

        const maxPosition = await this.subTaskRepository.getMaxPosition(taskId);
        const nextPosition = maxPosition + 1;

        return this.subTaskRepository.create({
            taskId,
            title: dto.title,
            isCompleted: false,
            position: nextPosition,
        });
    }

    /**
     * Update a subtask (title and/or isCompleted).
     * Validates membership and that the subtask belongs to the task.
     */
    async updateSubTask(
        userId: string,
        projectId: string,
        taskId: string,
        subTaskId: string,
        dto: UpdateSubTaskDto,
    ): Promise<SubTask> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskBelongsToProject(taskId, projectId);
        const subTask = await this.validateSubTaskBelongsToTask(
            subTaskId,
            taskId,
        );

        const updateData: Partial<SubTask> = {};
        if (dto.title !== undefined) {
            updateData.title = dto.title;
        }
        if (dto.isCompleted !== undefined) {
            updateData.isCompleted = dto.isCompleted;
        }

        const updated = await this.subTaskRepository.update(
            subTask.id,
            updateData,
        );
        if (!updated) {
            throw new NotFoundException(
                `SubTask with ID ${subTaskId} not found`,
            );
        }
        return updated;
    }

    /**
     * Delete a subtask (soft delete).
     * Validates membership and that the subtask belongs to the task.
     */
    async deleteSubTask(
        userId: string,
        projectId: string,
        taskId: string,
        subTaskId: string,
    ): Promise<void> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskBelongsToProject(taskId, projectId);
        await this.validateSubTaskBelongsToTask(subTaskId, taskId);

        await this.subTaskRepository.softDelete(subTaskId);
    }

    /**
     * Reorder subtasks within a task using a transaction.
     * Each item in the array specifies a subtask ID and its new position.
     */
    async reorderSubTasks(
        userId: string,
        projectId: string,
        taskId: string,
        dto: ReorderSubTasksDto,
    ): Promise<SubTask[]> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskBelongsToProject(taskId, projectId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const item of dto.subTasks ?? []) {
                await queryRunner.manager.update(SubTask, item.id, {
                    position: item.position,
                });
            }
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return this.subTaskRepository.findByTask(taskId);
    }

    // ─── Private Validation Helpers ───────────────────────────────

    /**
     * Validate that the user is a member of the given project.
     * Throws ForbiddenException if not.
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<void> {
        const membership = await this.projectMemberRepo.findOne({
            where: { userId, projectId },
        });
        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }
    }

    /**
     * Validate that the task belongs to the given project.
     * Throws NotFoundException if not found or does not belong.
     */
    private async validateTaskBelongsToProject(
        taskId: string,
        projectId: string,
    ): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, projectId },
        });
        if (!task) {
            throw new NotFoundException(
                `Task with ID ${taskId} not found in project ${projectId}`,
            );
        }
        return task;
    }

    /**
     * Validate that the subtask belongs to the given task.
     * Throws NotFoundException if not found or does not belong.
     */
    private async validateSubTaskBelongsToTask(
        subTaskId: string,
        taskId: string,
    ): Promise<SubTask> {
        const subTask = await this.subTaskRepository.findOne({
            id: subTaskId,
            taskId,
        } as any);
        if (!subTask) {
            throw new NotFoundException(
                `SubTask with ID ${subTaskId} not found in task ${taskId}`,
            );
        }
        return subTask;
    }
}
