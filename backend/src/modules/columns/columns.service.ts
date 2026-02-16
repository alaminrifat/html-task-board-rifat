import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { BoardColumn } from './column.entity';
import { ColumnRepository } from './column.repository';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './dtos';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

@Injectable()
export class ColumnsService extends BaseService<BoardColumn> {
    constructor(
        private readonly columnRepository: ColumnRepository,
        @InjectRepository(ProjectMember)
        private readonly memberRepository: Repository<ProjectMember>,
        private readonly dataSource: DataSource,
    ) {
        super(columnRepository, 'Column');
    }

    /**
     * List all columns for a project, ordered by position.
     * Requires the user to be a project member.
     */
    async getColumns(
        userId: string,
        projectId: string,
    ): Promise<BoardColumn[]> {
        await this.validateMembership(userId, projectId);
        return this.columnRepository.findByProject(projectId);
    }

    /**
     * Create a new column in a project.
     * Auto-assigns position to max+1. Owner-only.
     */
    async createColumn(
        userId: string,
        projectId: string,
        dto: CreateColumnDto,
    ): Promise<BoardColumn> {
        await this.validateOwnership(userId, projectId);

        const maxPosition =
            await this.columnRepository.getMaxPosition(projectId);

        return this.columnRepository.create({
            projectId,
            title: dto.title,
            position: maxPosition + 1,
            wipLimit: dto.wipLimit ?? null,
        });
    }

    /**
     * Update a column's title or WIP limit. Owner-only.
     */
    async updateColumn(
        userId: string,
        projectId: string,
        columnId: string,
        dto: UpdateColumnDto,
    ): Promise<BoardColumn> {
        await this.validateOwnership(userId, projectId);

        const column = await this.findColumnInProject(columnId, projectId);

        const updateData: Partial<BoardColumn> = {};
        if (dto.title !== undefined) {
            updateData.title = dto.title;
        }
        if (dto.wipLimit !== undefined) {
            updateData.wipLimit = dto.wipLimit;
        }

        const updated = await this.columnRepository.update(
            column.id,
            updateData,
        );
        return updated ?? column;
    }

    /**
     * Delete a column. Owner-only.
     * Rejects deletion if the column still contains tasks.
     */
    async deleteColumn(
        userId: string,
        projectId: string,
        columnId: string,
    ): Promise<void> {
        await this.validateOwnership(userId, projectId);

        const column = await this.findColumnInProject(columnId, projectId);

        const hasTasks = await this.columnRepository.hasTasksInColumn(
            column.id,
        );
        if (hasTasks) {
            throw new BadRequestException(
                'Cannot delete column that contains tasks. Move or delete tasks first.',
            );
        }

        await this.columnRepository.delete(column.id);
    }

    /**
     * Batch reorder columns within a project. Owner-only.
     * Runs all position updates inside a transaction.
     */
    async reorderColumns(
        userId: string,
        projectId: string,
        dto: ReorderColumnsDto,
    ): Promise<BoardColumn[]> {
        await this.validateOwnership(userId, projectId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Temporarily set all positions to negative values to avoid unique constraint violations
            const columnsToUpdate = dto.columns ?? [];
            for (let i = 0; i < columnsToUpdate.length; i++) {
                const item = columnsToUpdate[i];
                await queryRunner.manager.update(BoardColumn, item.id, {
                    position: -(i + 1),
                });
            }

            // Now set final positions
            for (const item of columnsToUpdate) {
                await queryRunner.manager.update(BoardColumn, item.id, {
                    position: item.position,
                });
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return this.columnRepository.findByProject(projectId);
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
     * Find a column ensuring it belongs to the given project.
     */
    private async findColumnInProject(
        columnId: string,
        projectId: string,
    ): Promise<BoardColumn> {
        const column = await this.columnRepository.findById(columnId);

        if (!column || column.projectId !== projectId) {
            throw new NotFoundException(
                `Column with ID ${columnId} not found in this project`,
            );
        }

        return column;
    }
}
