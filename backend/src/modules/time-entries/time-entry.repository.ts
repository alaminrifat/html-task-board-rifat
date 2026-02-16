import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { TimeEntry } from './time-entry.entity';
import { TimeEntryType } from '@shared/enums';

@Injectable()
export class TimeEntryRepository extends BaseRepository<TimeEntry> {
    constructor(
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepository: Repository<TimeEntry>,
    ) {
        super(timeEntryRepository);
    }

    /**
     * Find all time entries for a task, including user relation.
     */
    async findByTask(taskId: string): Promise<TimeEntry[]> {
        return this.timeEntryRepository.find({
            where: { taskId },
            relations: { user: true },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Find a running timer for a user on a specific task.
     * A running timer has entryType = TIMER and endedAt IS NULL.
     */
    async findActiveTimer(
        userId: string,
        taskId: string,
    ): Promise<TimeEntry | null> {
        return this.timeEntryRepository.findOne({
            where: {
                userId,
                taskId,
                entryType: TimeEntryType.TIMER,
                endedAt: IsNull(),
            },
        });
    }
}
