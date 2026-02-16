import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger, CurrentUser } from '@core/decorators';
import { SubTasksService } from './sub-tasks.service';
import { CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTasksDto } from './dtos';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import type { IJwtPayload } from '@shared/interfaces';
import { SubTask } from './sub-task.entity';

@ApiTags('Sub-Tasks')
@Controller('projects/:projectId/tasks/:taskId/subtasks')
export class SubTasksController {
    constructor(private readonly subTasksService: SubTasksService) {}

    /**
     * GET /projects/:projectId/tasks/:taskId/subtasks
     * List all subtasks for a task, ordered by position.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Sub-Tasks',
        operation: 'getAll',
        summary: 'List all subtasks for a task',
    })
    async getSubTasks(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<SuccessResponseDto<SubTask[]>> {
        const subTasks = await this.subTasksService.getSubTasks(
            user.id,
            projectId,
            taskId,
        );
        return new SuccessResponseDto(
            subTasks,
            'Subtasks retrieved successfully',
        );
    }

    /**
     * POST /projects/:projectId/tasks/:taskId/subtasks
     * Create a new subtask for a task.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Sub-Task',
        operation: 'create',
        successStatus: 201,
        summary: 'Create a new subtask',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Task not found in project' },
        ],
    })
    async createSubTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: CreateSubTaskDto,
    ): Promise<CreatedResponseDto<SubTask>> {
        const subTask = await this.subTasksService.createSubTask(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new CreatedResponseDto(subTask, 'Subtask created successfully');
    }

    /**
     * PATCH /projects/:projectId/tasks/:taskId/subtasks/reorder
     * Reorder subtasks within a task.
     * NOTE: This route MUST be defined BEFORE the /:subTaskId route to avoid conflict.
     */
    @Patch('reorder')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Sub-Tasks',
        operation: 'custom',
        summary: 'Reorder subtasks within a task',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Task not found in project' },
        ],
    })
    async reorderSubTasks(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: ReorderSubTasksDto,
    ): Promise<SuccessResponseDto<SubTask[]>> {
        const subTasks = await this.subTasksService.reorderSubTasks(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new SuccessResponseDto(
            subTasks,
            'Subtasks reordered successfully',
        );
    }

    /**
     * PATCH /projects/:projectId/tasks/:taskId/subtasks/:subTaskId
     * Update a subtask (title and/or completion status).
     */
    @Patch(':subTaskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Sub-Task',
        operation: 'update',
        summary: 'Update a subtask',
        paramName: 'subTaskId',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Subtask not found in task' },
        ],
    })
    async updateSubTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Param('subTaskId', ParseUUIDPipe) subTaskId: string,
        @Body() dto: UpdateSubTaskDto,
    ): Promise<SuccessResponseDto<SubTask>> {
        const subTask = await this.subTasksService.updateSubTask(
            user.id,
            projectId,
            taskId,
            subTaskId,
            dto,
        );
        return new SuccessResponseDto(subTask, 'Subtask updated successfully');
    }

    /**
     * DELETE /projects/:projectId/tasks/:taskId/subtasks/:subTaskId
     * Delete a subtask (soft delete).
     */
    @Delete(':subTaskId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Sub-Task',
        operation: 'delete',
        summary: 'Delete a subtask',
        paramName: 'subTaskId',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Subtask not found in task' },
        ],
    })
    async deleteSubTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Param('subTaskId', ParseUUIDPipe) subTaskId: string,
    ): Promise<DeletedResponseDto> {
        await this.subTasksService.deleteSubTask(
            user.id,
            projectId,
            taskId,
            subTaskId,
        );
        return new DeletedResponseDto('Subtask deleted successfully');
    }
}
