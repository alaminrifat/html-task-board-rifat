import {
    Controller,
    Get,
    Query,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import type { IJwtPayload } from '@shared/interfaces';
import { UserRole } from '@shared/enums';
import { AdminExportService } from './admin-export.service';
import { AdminExportFilterDto } from './dtos/admin-export-filter.dto';
import { AdminProjectExportFilterDto } from './dtos/admin-project-export-filter.dto';
import { AdminTaskExportFilterDto } from './dtos/admin-task-export-filter.dto';

@ApiTags('Admin - Export')
@Controller('admin/export')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminExportController {
    constructor(private readonly exportService: AdminExportService) {}

    /**
     * GET /admin/export/users
     * Export users as CSV.
     */
    @Get('users')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users Export',
        operation: 'custom',
        summary: 'Export users as CSV',
    })
    async exportUsers(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminExportFilterDto,
        @Res({ passthrough: false }) res: express.Response,
    ): Promise<void> {
        const csv = await this.exportService.generateUsersCsv(filter);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="user-report-${date}.csv"`,
        );
        res.send(csv);
    }

    /**
     * GET /admin/export/projects
     * Export projects as CSV.
     */
    @Get('projects')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Projects Export',
        operation: 'custom',
        summary: 'Export projects as CSV',
    })
    async exportProjects(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminProjectExportFilterDto,
        @Res({ passthrough: false }) res: express.Response,
    ): Promise<void> {
        const csv = await this.exportService.generateProjectsCsv(filter);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="project-report-${date}.csv"`,
        );
        res.send(csv);
    }

    /**
     * GET /admin/export/tasks
     * Export tasks as CSV.
     */
    @Get('tasks')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Tasks Export',
        operation: 'custom',
        summary: 'Export tasks as CSV',
    })
    async exportTasks(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminTaskExportFilterDto,
        @Res({ passthrough: false }) res: express.Response,
    ): Promise<void> {
        const csv = await this.exportService.generateTasksCsv(filter);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="task-report-${date}.csv"`,
        );
        res.send(csv);
    }
}
