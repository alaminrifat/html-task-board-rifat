import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { BoardColumn } from './column.entity';

@Injectable()
export class ColumnRepository extends BaseRepository<BoardColumn> {
    constructor(
        @InjectRepository(BoardColumn)
        private readonly columnRepository: Repository<BoardColumn>,
    ) {
        super(columnRepository);
    }

    /**
     * Find all columns for a project, ordered by position ascending
     */
    async findByProject(projectId: string): Promise<BoardColumn[]> {
        return this.columnRepository.find({
            where: { projectId },
            order: { position: 'ASC' },
        });
    }

    /**
     * Get the maximum position value for columns in a project.
     * Returns -1 if no columns exist (so first column gets position 0).
     */
    async getMaxPosition(projectId: string): Promise<number> {
        const result = await this.columnRepository
            .createQueryBuilder('column')
            .select('MAX(column.position)', 'maxPosition')
            .where('column.projectId = :projectId', { projectId })
            .getRawOne();

        return result?.maxPosition ?? -1;
    }

    /**
     * Check if a column has any tasks assigned to it
     */
    async hasTasksInColumn(columnId: string): Promise<boolean> {
        const count = await this.columnRepository
            .createQueryBuilder('column')
            .innerJoin('column.tasks', 'task')
            .where('column.id = :columnId', { columnId })
            .andWhere('task.deletedAt IS NULL')
            .getCount();

        return count > 0;
    }
}
