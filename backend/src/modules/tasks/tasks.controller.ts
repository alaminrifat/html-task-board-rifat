import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser, ApiSwagger } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    PaginatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { Task } from './task.entity';
import {
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    TaskFilterDto,
} from './dtos';

@ApiTags('Tasks')
@Controller('projects/:projectId/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    /**
     * GET /projects/:projectId/tasks
     * List tasks with filters and pagination.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async getTasks(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query() filters: TaskFilterDto,
    ): Promise<PaginatedResponseDto<Task>> {
        const result = await this.tasksService.getTasks(
            user.id,
            projectId,
            filters,
        );
        return new PaginatedResponseDto(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Tasks retrieved successfully',
        );
    }

    /**
     * POST /projects/:projectId/tasks
     * Create a new task.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'create',
        requestDto: CreateTaskDto,
        successStatus: 201,
    })
    async createTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: CreateTaskDto,
    ): Promise<CreatedResponseDto<Task>> {
        const task = await this.tasksService.createTask(
            user.id,
            projectId,
            dto,
        );
        return new CreatedResponseDto(task, 'Task created successfully');
    }

    /**
     * GET /projects/:projectId/tasks/trash
     * List trashed (soft-deleted) tasks. Owner-only.
     * IMPORTANT: This route must come BEFORE /:taskId to avoid conflict.
     */
    @Get('trash')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Trashed Tasks',
        operation: 'custom',
        summary: 'List trashed tasks (Owner only)',
        isArray: true,
    })
    async getTrashedTasks(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Task[]>> {
        const tasks = await this.tasksService.getTrashedTasks(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            tasks,
            'Trashed tasks retrieved successfully',
        );
    }

    /**
     * GET /projects/:projectId/tasks/:taskId
     * Get a single task with full details.
     */
    @Get(':taskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'getOne',
        paramName: 'taskId',
    })
    async getTaskById(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<SuccessResponseDto<Task>> {
        const task = await this.tasksService.getTaskById(
            user.id,
            projectId,
            taskId,
        );
        return new SuccessResponseDto(task, 'Task retrieved successfully');
    }

    /**
     * PATCH /projects/:projectId/tasks/:taskId
     * Update a task. Owner can edit any; member can edit own.
     */
    @Patch(':taskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'update',
        requestDto: UpdateTaskDto,
        paramName: 'taskId',
    })
    async updateTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: UpdateTaskDto,
    ): Promise<UpdatedResponseDto<Task>> {
        const task = await this.tasksService.updateTask(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new UpdatedResponseDto(task, 'Task updated successfully');
    }

    /**
     * PATCH /projects/:projectId/tasks/:taskId/move
     * Move a task between columns or reorder within a column.
     */
    @Patch(':taskId/move')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'custom',
        summary: 'Move task between columns or reorder',
        requestDto: MoveTaskDto,
    })
    async moveTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: MoveTaskDto,
    ): Promise<UpdatedResponseDto<Task>> {
        const task = await this.tasksService.moveTask(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new UpdatedResponseDto(task, 'Task moved successfully');
    }

    /**
     * DELETE /projects/:projectId/tasks/:taskId
     * Soft-delete a task. Owner-only.
     */
    @Delete(':taskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'delete',
        paramName: 'taskId',
    })
    async deleteTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<DeletedResponseDto> {
        await this.tasksService.deleteTask(user.id, projectId, taskId);
        return new DeletedResponseDto('Task deleted successfully');
    }

    /**
     * POST /projects/:projectId/tasks/:taskId/restore
     * Restore a soft-deleted task. Owner-only.
     */
    @Post(':taskId/restore')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'custom',
        summary: 'Restore task from trash (Owner only)',
    })
    async restoreTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<SuccessResponseDto<Task>> {
        const task = await this.tasksService.restoreTask(
            user.id,
            projectId,
            taskId,
        );
        return new SuccessResponseDto(task, 'Task restored successfully');
    }

    /**
     * DELETE /projects/:projectId/tasks/trash/:taskId
     * Permanently delete a task from trash. Owner-only.
     */
    @Delete('trash/:taskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Task',
        operation: 'custom',
        summary: 'Permanently delete task from trash (Owner only)',
    })
    async permanentDeleteTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<DeletedResponseDto> {
        await this.tasksService.permanentDeleteTask(user.id, projectId, taskId);
        return new DeletedResponseDto('Task permanently deleted');
    }
}

/**
 * Separate controller for user-scoped task routes.
 * GET /users/me/tasks - Get all tasks assigned to the current user across all projects.
 */
@ApiTags('Tasks')
@Controller('users/me/tasks')
export class MyTasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'My Tasks',
        operation: 'custom',
        summary: 'Get tasks assigned to me across all projects',
        isArray: true,
    })
    async getMyTasks(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto<Task[]>> {
        const tasks = await this.tasksService.getMyTasks(user.id);
        return new SuccessResponseDto(tasks, 'My tasks retrieved successfully');
    }
}
