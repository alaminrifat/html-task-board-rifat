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
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    PaginatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos/response.dto';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from './dtos';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    /**
     * GET /projects
     * List the authenticated user's projects with filtering, search, and pagination.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Projects',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async findAll(
        @CurrentUser() user: IJwtPayload,
        @Query() filters: ProjectFilterDto,
    ): Promise<PaginatedResponseDto<Project>> {
        const result = await this.projectsService.getProjects(user.id, filters);
        return new PaginatedResponseDto(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Projects retrieved successfully',
        );
    }

    /**
     * POST /projects
     * Create a new project. The authenticated user becomes the owner.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Project',
        operation: 'create',
        successStatus: 201,
    })
    async create(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: CreateProjectDto,
    ): Promise<CreatedResponseDto<Project>> {
        const project = await this.projectsService.createProject(user.id, dto);
        return new CreatedResponseDto(project, 'Project created successfully');
    }

    /**
     * GET /projects/:projectId
     * Get project details. Requires project membership.
     */
    @Get(':projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project',
        operation: 'getOne',
        paramName: 'projectId',
    })
    async findOne(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Project>> {
        const project = await this.projectsService.getProjectById(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            project,
            'Project retrieved successfully',
        );
    }

    /**
     * GET /projects/:projectId/board
     * Get the full board state (columns, tasks, labels, assignees).
     * Requires project membership.
     */
    @Get(':projectId/board')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project Board',
        operation: 'custom',
        summary: 'Get project board with columns and tasks',
    })
    async getBoard(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Project>> {
        const project = await this.projectsService.getProjectBoard(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            project,
            'Project board retrieved successfully',
        );
    }

    /**
     * PATCH /projects/:projectId
     * Update a project. Only the project owner can update.
     */
    @Patch(':projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project',
        operation: 'update',
        paramName: 'projectId',
    })
    async update(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: UpdateProjectDto,
    ): Promise<UpdatedResponseDto<Project>> {
        const project = await this.projectsService.updateProject(
            user.id,
            projectId,
            dto,
        );
        return new UpdatedResponseDto(project, 'Project updated successfully');
    }

    /**
     * POST /projects/:projectId/archive
     * Archive a project. Only the project owner can archive.
     */
    @Post(':projectId/archive')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project',
        operation: 'custom',
        summary: 'Archive a project',
        errors: [
            { status: 403, description: 'Only the project owner can archive' },
            { status: 404, description: 'Project not found' },
        ],
    })
    async archive(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Project>> {
        const project = await this.projectsService.archiveProject(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(project, 'Project archived successfully');
    }

    /**
     * DELETE /projects/:projectId
     * Soft-delete a project. Only the project owner can delete.
     */
    @Delete(':projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project',
        operation: 'delete',
        paramName: 'projectId',
    })
    async remove(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<DeletedResponseDto> {
        await this.projectsService.deleteProject(user.id, projectId);
        return new DeletedResponseDto('Project deleted successfully');
    }
}
