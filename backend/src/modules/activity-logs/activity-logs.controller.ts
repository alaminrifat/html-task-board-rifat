import {
    Controller,
    Get,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger, CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import { PaginatedResponseDto } from '@shared/dtos/response.dto';
import { PaginationDto } from '@shared/dtos/pagination.dto';
import { ActivityLog } from './activity-log.entity';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('Activity Logs')
@Controller('projects/:projectId/activity')
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) {}

    /**
     * GET /projects/:projectId/activity
     * Paginated activity feed for a project.
     * Requires project membership.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Activity Logs',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
        errors: [{ status: 403, description: 'Not a member of this project' }],
    })
    async findAll(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query() pagination: PaginationDto,
        @Query('taskId') taskId?: string,
    ): Promise<PaginatedResponseDto<ActivityLog>> {
        const result = await this.activityLogsService.getProjectActivity(
            user.id,
            projectId,
            pagination,
            taskId,
        );

        return new PaginatedResponseDto<ActivityLog>(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Activity logs retrieved successfully',
        );
    }
}
