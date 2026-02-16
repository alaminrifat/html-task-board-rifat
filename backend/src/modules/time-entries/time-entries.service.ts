import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { TimeEntry } from './time-entry.entity';
import { TimeEntryRepository } from './time-entry.repository';
import { CreateManualTimeEntryDto, UpdateTimeEntryDto } from './dtos';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { TimeEntryType } from '@shared/enums';

@Injectable()
export class TimeEntriesService extends BaseService<TimeEntry> {
    constructor(
        private readonly timeEntryRepository: TimeEntryRepository,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepository: Repository<ProjectMember>,
    ) {
        super(timeEntryRepository, 'TimeEntry');
    }

    /**
     * List all time entries for a task.
     * Requires user to be a project member.
     */
    async getTimeEntries(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<TimeEntry[]> {
        await this.validateMembership(userId, projectId);
        return this.timeEntryRepository.findByTask(taskId);
    }

    /**
     * Create a manual time entry for a task.
     */
    async createManualEntry(
        userId: string,
        projectId: string,
        taskId: string,
        dto: CreateManualTimeEntryDto,
    ): Promise<TimeEntry> {
        await this.validateMembership(userId, projectId);

        return this.timeEntryRepository.create({
            taskId,
            userId,
            entryType: TimeEntryType.MANUAL,
            durationMinutes: dto.durationMinutes,
            description: dto.description ?? null,
            startedAt: null,
            endedAt: null,
        });
    }

    /**
     * Start a timer on a task.
     * Only one active timer per user per task is allowed.
     */
    async startTimer(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<TimeEntry> {
        await this.validateMembership(userId, projectId);

        // Check if user already has an active timer on this task
        const activeTimer = await this.timeEntryRepository.findActiveTimer(
            userId,
            taskId,
        );

        if (activeTimer) {
            throw new BadRequestException(
                'You already have an active timer on this task',
            );
        }

        return this.timeEntryRepository.create({
            taskId,
            userId,
            entryType: TimeEntryType.TIMER,
            durationMinutes: 0,
            startedAt: new Date(),
            endedAt: null,
            description: null,
        });
    }

    /**
     * Stop a running timer.
     * Only the timer owner can stop it.
     * Calculates duration from startedAt to now.
     */
    async stopTimer(userId: string, timeEntryId: string): Promise<TimeEntry> {
        const timeEntry = await this.timeEntryRepository.findById(timeEntryId);

        if (!timeEntry) {
            throw new NotFoundException(
                `Time entry with ID ${timeEntryId} not found`,
            );
        }

        // Owner check
        if (timeEntry.userId !== userId) {
            throw new ForbiddenException(
                'Only the timer owner can stop this timer',
            );
        }

        // Must be a TIMER type
        if (timeEntry.entryType !== TimeEntryType.TIMER) {
            throw new BadRequestException('This time entry is not a timer');
        }

        // Must still be running
        if (timeEntry.endedAt !== null) {
            throw new BadRequestException(
                'This timer has already been stopped',
            );
        }

        const endedAt = new Date();
        const startedAt = timeEntry.startedAt as Date;
        const durationMinutes = Math.round(
            (endedAt.getTime() - startedAt.getTime()) / 60000,
        );

        const updated = await this.timeEntryRepository.update(timeEntryId, {
            endedAt,
            durationMinutes: Math.max(durationMinutes, 1), // Minimum 1 minute
        });

        return updated ?? timeEntry;
    }

    /**
     * Update a time entry (duration and/or description).
     * Only the entry owner can update it.
     */
    async updateTimeEntry(
        userId: string,
        timeEntryId: string,
        dto: UpdateTimeEntryDto,
    ): Promise<TimeEntry> {
        const timeEntry = await this.timeEntryRepository.findById(timeEntryId);

        if (!timeEntry) {
            throw new NotFoundException(
                `Time entry with ID ${timeEntryId} not found`,
            );
        }

        // Owner check
        if (timeEntry.userId !== userId) {
            throw new ForbiddenException(
                'Only the entry owner can update this time entry',
            );
        }

        const updateData: Partial<TimeEntry> = {};
        if (dto.durationMinutes !== undefined) {
            updateData.durationMinutes = dto.durationMinutes;
        }
        if (dto.description !== undefined) {
            updateData.description = dto.description;
        }

        const updated = await this.timeEntryRepository.update(
            timeEntryId,
            updateData,
        );
        return updated ?? timeEntry;
    }

    /**
     * Delete a time entry.
     * Only the entry owner can delete it.
     */
    async deleteTimeEntry(userId: string, timeEntryId: string): Promise<void> {
        const timeEntry = await this.timeEntryRepository.findById(timeEntryId);

        if (!timeEntry) {
            throw new NotFoundException(
                `Time entry with ID ${timeEntryId} not found`,
            );
        }

        // Owner check
        if (timeEntry.userId !== userId) {
            throw new ForbiddenException(
                'Only the entry owner can delete this time entry',
            );
        }

        await this.timeEntryRepository.delete(timeEntryId);
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
}
