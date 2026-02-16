import {
    Controller,
    Get,
    Post,
    Delete,
    Query,
    Param,
    Body,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import type { IJwtPayload } from '@shared/interfaces';
import { UserRole } from '@shared/enums';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    PaginatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos/response.dto';
import { AdminProjectsService } from './admin-projects.service';
import {
    AdminProjectFilterDto,
    BulkProjectActionDto,
    CreateAdminProjectDto,
} from './dtos';

@ApiTags('Admin - Projects')
@Controller('admin/projects')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProjectsController {
    constructor(private readonly projectsService: AdminProjectsService) {}

    /**
     * POST /admin/projects
     * Create a new project on behalf of a user.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Admin Project',
        operation: 'create',
        successStatus: 201,
    })
    async create(
        @Body() dto: CreateAdminProjectDto,
    ): Promise<CreatedResponseDto> {
        const project = await this.projectsService.createProject(dto);
        return new CreatedResponseDto(project, 'Project created successfully');
    }

    /**
     * GET /admin/projects
     * List all projects with filtering, search, sorting, and pagination.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Projects',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async findAll(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminProjectFilterDto,
    ): Promise<PaginatedResponseDto> {
        const result = await this.projectsService.getProjects(filter);
        return new PaginatedResponseDto(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Projects retrieved successfully',
        );
    }

    /**
     * GET /admin/projects/export
     * CSV export of projects with the same filters as the list.
     */
    @Get('export')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Projects Export',
        operation: 'custom',
        summary: 'Export projects as CSV',
    })
    async exportCsv(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminProjectFilterDto,
        @Res({ passthrough: false }) res: express.Response,
    ): Promise<void> {
        const projects =
            await this.projectsService.getProjectsForExport(filter);

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="project-report-${date}.csv"`,
        );

        // Build CSV manually
        const headers = [
            'Title',
            'Owner',
            'Owner Email',
            'Status',
            'Members',
            'Tasks',
            'Completion %',
            'Created',
            'Deadline',
        ];

        const escapeCsv = (value: unknown): string => {
            if (value === null || value === undefined) return '';
            const str =
                typeof value === 'string' ? value : JSON.stringify(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const headerLine = headers.map(escapeCsv).join(',');
        const dataLines = projects.map((p) =>
            [
                p.title,
                p.owner?.name || '',
                p.owner?.email || '',
                p.status,
                p.membersCount,
                p.tasksCount,
                p.completionPercent,
                p.createdAt
                    ? new Date(p.createdAt).toISOString().split('T')[0]
                    : '',
                p.deadline
                    ? new Date(p.deadline).toISOString().split('T')[0]
                    : '',
            ]
                .map(escapeCsv)
                .join(','),
        );

        const csv = [headerLine, ...dataLines].join('\r\n');
        res.send(csv);
    }

    /**
     * POST /admin/projects/bulk
     * Bulk archive or delete projects.
     */
    @Post('bulk')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Bulk Project Action',
        operation: 'custom',
        summary: 'Bulk archive or delete projects',
    })
    async bulkAction(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: BulkProjectActionDto,
    ): Promise<SuccessResponseDto> {
        const result = await this.projectsService.bulkAction(dto);
        return new SuccessResponseDto(result, 'Bulk action completed');
    }

    /**
     * GET /admin/projects/:projectId
     * Get detailed project information.
     */
    @Get(':projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Project',
        operation: 'getOne',
        paramName: 'projectId',
    })
    async findOne(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto> {
        const project = await this.projectsService.getProjectDetail(projectId);
        return new SuccessResponseDto(
            project,
            'Project retrieved successfully',
        );
    }

    /**
     * POST /admin/projects/:projectId/archive
     * Archive a project. Returns 422 if already archived.
     */
    @Post(':projectId/archive')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Project Archive',
        operation: 'custom',
        summary: 'Archive a project',
        errors: [
            { status: 404, description: 'Project not found' },
            { status: 422, description: 'Project is already archived' },
        ],
    })
    async archive(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto> {
        const result = await this.projectsService.archiveProject(projectId);
        return new SuccessResponseDto(result, 'Project archived successfully');
    }

    /**
     * DELETE /admin/projects/:projectId
     * Soft-delete a project.
     */
    @Delete(':projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Project',
        operation: 'delete',
        paramName: 'projectId',
    })
    async remove(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<DeletedResponseDto> {
        await this.projectsService.deleteProject(projectId);
        return new DeletedResponseDto('Project deleted successfully');
    }
}
