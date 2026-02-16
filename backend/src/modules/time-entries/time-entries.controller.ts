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
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntry } from './time-entry.entity';
import { CreateManualTimeEntryDto, UpdateTimeEntryDto } from './dtos';

@ApiTags('Time Entries')
@Controller()
export class TimeEntriesController {
    constructor(private readonly timeEntriesService: TimeEntriesService) {}

    @Get('projects/:projectId/tasks/:taskId/time-entries')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'getAll',
        isArray: true,
    })
    async getTimeEntries(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<SuccessResponseDto<TimeEntry[]>> {
        const entries = await this.timeEntriesService.getTimeEntries(
            user.id,
            projectId,
            taskId,
        );
        return new SuccessResponseDto(
            entries,
            'Time entries retrieved successfully',
        );
    }

    @Post('projects/:projectId/tasks/:taskId/time-entries')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'create',
        successStatus: 201,
    })
    async createManualEntry(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: CreateManualTimeEntryDto,
    ): Promise<CreatedResponseDto<TimeEntry>> {
        const entry = await this.timeEntriesService.createManualEntry(
            user.id,
            projectId,
            taskId,
            dto,
        );
        return new CreatedResponseDto(entry, 'Time entry created successfully');
    }

    @Post('projects/:projectId/tasks/:taskId/time-entries/start')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'custom',
        summary: 'Start a timer on a task',
        successStatus: 201,
    })
    async startTimer(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<CreatedResponseDto<TimeEntry>> {
        const entry = await this.timeEntriesService.startTimer(
            user.id,
            projectId,
            taskId,
        );
        return new CreatedResponseDto(entry, 'Timer started successfully');
    }

    @Post('time-entries/:timeEntryId/stop')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'custom',
        summary: 'Stop a running timer',
    })
    async stopTimer(
        @CurrentUser() user: IJwtPayload,
        @Param('timeEntryId', ParseUUIDPipe) timeEntryId: string,
    ): Promise<SuccessResponseDto<TimeEntry>> {
        const entry = await this.timeEntriesService.stopTimer(
            user.id,
            timeEntryId,
        );
        return new SuccessResponseDto(entry, 'Timer stopped successfully');
    }

    @Patch('time-entries/:timeEntryId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'update',
        paramName: 'timeEntryId',
    })
    async updateTimeEntry(
        @CurrentUser() user: IJwtPayload,
        @Param('timeEntryId', ParseUUIDPipe) timeEntryId: string,
        @Body() dto: UpdateTimeEntryDto,
    ): Promise<UpdatedResponseDto<TimeEntry>> {
        const entry = await this.timeEntriesService.updateTimeEntry(
            user.id,
            timeEntryId,
            dto,
        );
        return new UpdatedResponseDto(entry, 'Time entry updated successfully');
    }

    @Delete('time-entries/:timeEntryId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'TimeEntry',
        operation: 'delete',
        paramName: 'timeEntryId',
    })
    async deleteTimeEntry(
        @CurrentUser() user: IJwtPayload,
        @Param('timeEntryId', ParseUUIDPipe) timeEntryId: string,
    ): Promise<DeletedResponseDto> {
        await this.timeEntriesService.deleteTimeEntry(user.id, timeEntryId);
        return new DeletedResponseDto('Time entry deleted successfully');
    }
}
