import {
    Controller,
    Get,
    Param,
    Query,
    Res,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import { SuccessResponseDto } from '@shared/dtos/response.dto';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto, DashboardChartsFilterDto } from './dtos';

@ApiTags('Project Dashboard')
@Controller('projects/:projectId')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    /**
     * GET /projects/:projectId/dashboard/summary
     * Get dashboard summary with task counts, completion %, and time logged.
     */
    @Get('dashboard/summary')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Dashboard Summary',
        operation: 'custom',
        summary: 'Get project dashboard summary',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Project not found' },
        ],
    })
    async getSummary(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query() filters: DashboardFilterDto,
    ): Promise<SuccessResponseDto<any>> {
        const summary = await this.dashboardService.getSummary(
            user.id,
            projectId,
            filters,
        );
        return new SuccessResponseDto(
            summary,
            'Dashboard summary retrieved successfully',
        );
    }

    /**
     * GET /projects/:projectId/dashboard/charts
     * Get dashboard chart data: tasks per status, priority, workload, and trend.
     */
    @Get('dashboard/charts')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Dashboard Charts',
        operation: 'custom',
        summary: 'Get project dashboard chart data',
        errors: [
            { status: 403, description: 'Not a member of this project' },
            { status: 404, description: 'Project not found' },
        ],
    })
    async getCharts(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query() filters: DashboardChartsFilterDto,
    ): Promise<SuccessResponseDto<any>> {
        const charts = await this.dashboardService.getCharts(
            user.id,
            projectId,
            filters,
        );
        return new SuccessResponseDto(
            charts,
            'Dashboard charts retrieved successfully',
        );
    }

    /**
     * GET /projects/:projectId/export
     * Export all project tasks as CSV. Owner only.
     */
    @Get('export')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project Export',
        operation: 'custom',
        summary: 'Export project tasks as CSV',
        errors: [
            { status: 403, description: 'Only the project owner can export' },
            { status: 404, description: 'Project not found' },
        ],
    })
    async exportProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @CurrentUser() user: IJwtPayload,
        @Res() res: express.Response,
    ): Promise<void> {
        const { csv, filename } = await this.dashboardService.exportProjectCsv(
            user.id,
            projectId,
        );

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`,
        );
        res.send(csv);
    }
}
