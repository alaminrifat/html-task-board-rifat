import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { Label } from './label.entity';
import { LabelRepository } from './label.repository';
import { CreateLabelDto, UpdateLabelDto } from './dtos';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

@Injectable()
export class LabelsService extends BaseService<Label> {
    constructor(
        private readonly labelRepository: LabelRepository,
        @InjectRepository(ProjectMember)
        private readonly memberRepository: Repository<ProjectMember>,
    ) {
        super(labelRepository, 'Label');
    }

    /**
     * List all labels for a project (project-specific + system labels).
     * Requires the user to be a project member.
     */
    async getLabels(userId: string, projectId: string): Promise<Label[]> {
        await this.validateMembership(userId, projectId);
        return this.labelRepository.findByProject(projectId);
    }

    /**
     * Create a new project-scoped label. Owner-only.
     */
    async createLabel(
        userId: string,
        projectId: string,
        dto: CreateLabelDto,
    ): Promise<Label> {
        await this.validateOwnership(userId, projectId);

        return this.labelRepository.create({
            projectId,
            name: dto.name,
            color: dto.color,
        });
    }

    /**
     * Update a project label. Owner-only.
     * Cannot update system labels (projectId IS NULL).
     */
    async updateLabel(
        userId: string,
        projectId: string,
        labelId: string,
        dto: UpdateLabelDto,
    ): Promise<Label> {
        await this.validateOwnership(userId, projectId);

        const label = await this.findProjectLabel(labelId, projectId);

        const updateData: Partial<Label> = {};
        if (dto.name !== undefined) {
            updateData.name = dto.name;
        }
        if (dto.color !== undefined) {
            updateData.color = dto.color;
        }

        const updated = await this.labelRepository.update(label.id, updateData);
        return updated ?? label;
    }

    /**
     * Delete a project label. Owner-only.
     * Cannot delete system labels (projectId IS NULL).
     */
    async deleteLabel(
        userId: string,
        projectId: string,
        labelId: string,
    ): Promise<void> {
        await this.validateOwnership(userId, projectId);

        const label = await this.findProjectLabel(labelId, projectId);

        await this.labelRepository.delete(label.id);
    }

    // ─── Private Helpers ──────────────────────────────────────────

    /**
     * Verify the user is a member of the project (any role).
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const member = await this.memberRepository.findOne({
            where: { userId, projectId },
        });

        if (!member) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }

        return member;
    }

    /**
     * Verify the user is the OWNER of the project.
     */
    private async validateOwnership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const member = await this.validateMembership(userId, projectId);

        if (member.projectRole !== ProjectRole.OWNER) {
            throw new ForbiddenException(
                'Only the project owner can perform this action',
            );
        }

        return member;
    }

    /**
     * Find a label ensuring it belongs to the given project (not a system label).
     * System labels (projectId IS NULL) cannot be modified by users.
     */
    private async findProjectLabel(
        labelId: string,
        projectId: string,
    ): Promise<Label> {
        const label = await this.labelRepository.findById(labelId);

        if (!label) {
            throw new NotFoundException(`Label with ID ${labelId} not found`);
        }

        if (label.projectId === null) {
            throw new BadRequestException('System labels cannot be modified');
        }

        if (label.projectId !== projectId) {
            throw new NotFoundException(
                `Label with ID ${labelId} not found in this project`,
            );
        }

        return label;
    }
}
