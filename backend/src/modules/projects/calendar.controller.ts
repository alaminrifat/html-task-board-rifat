import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    UpdatedResponseDto,
} from '@shared/dtos/response.dto';
import { CalendarService } from './calendar.service';
import { CalendarFilterDto, RescheduleTaskDto } from './dtos';

@ApiTags('Project Calendar')
@Controller('projects/:projectId/calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    /**
     * GET /projects/:projectId/calendar
     * Get tasks with due dates in a given month/year for the calendar view.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Calendar Tasks',
        operation: 'custom',
        summary: 'Get calendar tasks for a month',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Project not found' },
        ],
    })
    async getCalendarTasks(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query() filters: CalendarFilterDto,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.calendarService.getCalendarTasks(
            user.id,
            projectId,
            filters,
        );
        return new SuccessResponseDto(
            result,
            'Calendar tasks retrieved successfully',
        );
    }

    /**
     * PATCH /projects/:projectId/calendar/tasks/:taskId/reschedule
     * Reschedule a task's due date. Owner only.
     */
    @Patch('tasks/:taskId/reschedule')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Calendar Task',
        operation: 'custom',
        summary: 'Reschedule a task due date',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can reschedule tasks',
            },
            { status: 404, description: 'Task not found in this project' },
        ],
    })
    async rescheduleTask(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: RescheduleTaskDto,
    ): Promise<UpdatedResponseDto<any>> {
        const result = await this.calendarService.rescheduleTask(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new UpdatedResponseDto(result, 'Task rescheduled successfully');
    }
}
