import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Project } from './project.entity';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from './dtos';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { BoardTemplate, ProjectRole, ProjectStatus } from '@shared/enums';

/** Column definitions for each board template */
const TEMPLATE_COLUMNS: Record<BoardTemplate, string[]> = {
    [BoardTemplate.DEFAULT]: ['To Do', 'In Progress', 'Review', 'Done'],
    [BoardTemplate.MINIMAL]: ['To Do', 'Done'],
    [BoardTemplate.CUSTOM]: ['To Do', 'Done'],
};

@Injectable()
export class ProjectsService extends BaseService<Project> {
    constructor(
        private readonly projectRepository: ProjectRepository,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
        private readonly dataSource: DataSource,
        private readonly i18nHelper: I18nHelper,
    ) {
        super(projectRepository, 'Project');
    }

    /**
     * Create a new project with default board columns and owner membership.
     * Runs inside a transaction to ensure atomicity.
     */
    async createProject(
        userId: string,
        dto: CreateProjectDto,
    ): Promise<Project> {
        const template = dto.template ?? BoardTemplate.DEFAULT;

        return this.dataSource.transaction(async (manager) => {
            // 1. Create the project
            const project = manager.create(Project, {
                title: dto.title,
                description: dto.description ?? null,
                ownerId: userId,
                template,
                deadline: dto.deadline ? new Date(dto.deadline) : null,
                status: ProjectStatus.ACTIVE,
            });
            const savedProject = await manager.save(Project, project);

            // 2. Create default board columns based on template
            const columnTitles =
                TEMPLATE_COLUMNS[template] ??
                TEMPLATE_COLUMNS[BoardTemplate.DEFAULT];
            const columns = columnTitles.map((title, index) =>
                manager.create(BoardColumn, {
                    projectId: savedProject.id,
                    title,
                    position: index,
                }),
            );
            await manager.save(BoardColumn, columns);

            // 3. Add creator as OWNER member
            const member = manager.create(ProjectMember, {
                projectId: savedProject.id,
                userId,
                projectRole: ProjectRole.OWNER,
            });
            await manager.save(ProjectMember, member);

            // Return the project with its columns
            return manager.findOne(Project, {
                where: { id: savedProject.id },
                relations: { owner: true, columns: true, members: true },
            }) as Promise<Project>;
        });
    }

    /**
     * List projects where the user is a member, with filters and pagination.
     */
    async getProjects(
        userId: string,
        filters: ProjectFilterDto,
    ): Promise<{
        data: Project[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;

        const result = await this.projectRepository.findProjectsForUser(
            userId,
            filters,
        );

        return {
            data: result.data,
            total: result.total,
            page,
            limit,
        };
    }

    /**
     * Get a single project by ID, validating that the user is a member.
     */
    async getProjectById(userId: string, projectId: string): Promise<Project> {
        await this.validateMembership(userId, projectId);

        const project = await this.projectRepository.findById(projectId, {
            owner: true,
            members: { user: true },
            columns: true,
        });

        if (!project) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.projects.errors.not_found', {
                    id: projectId,
                }) || `Project with ID ${projectId} not found`,
            );
        }

        return project;
    }

    /**
     * Get full board state: project with columns, tasks, labels, assignees.
     */
    async getProjectBoard(userId: string, projectId: string): Promise<Project> {
        await this.validateMembership(userId, projectId);

        const project =
            await this.projectRepository.findProjectWithBoard(projectId);

        if (!project) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.projects.errors.not_found', {
                    id: projectId,
                }) || `Project with ID ${projectId} not found`,
            );
        }

        return project;
    }

    /**
     * Update a project. Only the owner is allowed to update.
     */
    async updateProject(
        userId: string,
        projectId: string,
        dto: UpdateProjectDto,
    ): Promise<Project> {
        await this.validateOwnership(userId, projectId);

        const updateData: Record<string, unknown> = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.deadline !== undefined) {
            updateData.deadline = dto.deadline ? new Date(dto.deadline) : null;
        }

        const updated = await this.repository.update(
            projectId,
            updateData as any,
        );

        if (!updated) {
            return this.findByIdOrFail(projectId);
        }
        return updated;
    }

    /**
     * Archive a project. Only the owner is allowed to archive.
     */
    async archiveProject(userId: string, projectId: string): Promise<Project> {
        await this.validateOwnership(userId, projectId);

        const updated = await this.repository.update(projectId, {
            status: ProjectStatus.ARCHIVED,
        } as any);

        if (!updated) {
            return this.findByIdOrFail(projectId);
        }
        return updated;
    }

    /**
     * Soft-delete a project. Only the owner is allowed to delete.
     */
    async deleteProject(userId: string, projectId: string): Promise<void> {
        await this.validateOwnership(userId, projectId);
        await this.repository.softDelete(projectId);
    }

    // ─── Private Helpers ─────────────────────────────────────────────

    /**
     * Validate that the user is a member of the project.
     * Throws ForbiddenException if not a member.
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        // First check that the project exists
        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.projects.errors.not_found', {
                    id: projectId,
                }) || `Project with ID ${projectId} not found`,
            );
        }

        const member = await this.memberRepo.findOne({
            where: { projectId, userId },
        });

        if (!member) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.projects.errors.not_member') ||
                    'You are not a member of this project',
            );
        }

        return member;
    }

    /**
     * Validate that the user is the owner of the project.
     * Throws ForbiddenException if not the owner.
     */
    private async validateOwnership(
        userId: string,
        projectId: string,
    ): Promise<void> {
        const member = await this.validateMembership(userId, projectId);

        if (member.projectRole !== ProjectRole.OWNER) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.projects.errors.not_owner') ||
                    'Only the project owner can perform this action',
            );
        }
    }
}
