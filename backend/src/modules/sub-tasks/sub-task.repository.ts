import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { SubTask } from './sub-task.entity';

@Injectable()
export class SubTaskRepository extends BaseRepository<SubTask> {
    constructor(
        @InjectRepository(SubTask)
        private readonly subTaskRepository: Repository<SubTask>,
    ) {
        super(subTaskRepository);
    }

    /**
     * Find all subtasks for a given task, ordered by position ascending
     */
    async findByTask(taskId: string): Promise<SubTask[]> {
        return this.subTaskRepository.find({
            where: { taskId },
            order: { position: 'ASC' },
        });
    }

    /**
     * Get the maximum position value among subtasks of a given task.
     * Returns -1 if no subtasks exist, so the next position will be 0.
     */
    async getMaxPosition(taskId: string): Promise<number> {
        const result = await this.subTaskRepository
            .createQueryBuilder('subTask')
            .select('MAX(subTask.position)', 'maxPosition')
            .where('subTask.task_id = :taskId', { taskId })
            .getRawOne();

        return result?.maxPosition ?? -1;
    }
}
