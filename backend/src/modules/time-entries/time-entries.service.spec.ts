import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntryRepository } from './time-entry.repository';
import { TimeEntry } from './time-entry.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { TimeEntryType } from '@shared/enums';
import { CreateManualTimeEntryDto, UpdateTimeEntryDto } from './dtos';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const createMockTimeEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry =>
    ({
        id: 'entry-1',
        taskId: 'task-1',
        userId: 'user-1',
        entryType: TimeEntryType.MANUAL,
        durationMinutes: 60,
        startedAt: null,
        endedAt: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as unknown as TimeEntry;

const createMockMember = (): ProjectMember =>
    ({
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
    }) as unknown as ProjectMember;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('TimeEntriesService', () => {
    let service: TimeEntriesService;
    let timeEntryRepository: Record<string, jest.Mock>;
    let taskRepository: { findOne: jest.Mock };
    let memberRepository: { findOne: jest.Mock };

    beforeEach(async () => {
        timeEntryRepository = {
            findByTask: jest.fn(),
            findById: jest.fn(),
            findActiveTimer: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        taskRepository = { findOne: jest.fn() };
        memberRepository = { findOne: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimeEntriesService,
                { provide: TimeEntryRepository, useValue: timeEntryRepository },
                { provide: getRepositoryToken(Task), useValue: taskRepository },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepository,
                },
            ],
        }).compile();

        service = module.get<TimeEntriesService>(TimeEntriesService);
    });

    const userId = 'user-1';
    const projectId = 'project-1';
    const taskId = 'task-1';

    // ─── getTimeEntries ──────────────────────────────────────────────

    describe('getTimeEntries', () => {
        it('should return time entries for a task when user is a member', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            const entries = [createMockTimeEntry()];
            timeEntryRepository.findByTask.mockResolvedValue(entries);

            const result = await service.getTimeEntries(
                userId,
                projectId,
                taskId,
            );

            expect(result).toEqual(entries);
            expect(timeEntryRepository.findByTask).toHaveBeenCalledWith(taskId);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            await expect(
                service.getTimeEntries(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── createManualEntry ───────────────────────────────────────────

    describe('createManualEntry', () => {
        it('should create a MANUAL time entry with duration', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());

            const dto: CreateManualTimeEntryDto = {
                durationMinutes: 90,
                description: 'Design review',
            };
            const created = createMockTimeEntry({
                entryType: TimeEntryType.MANUAL,
                durationMinutes: 90,
                description: 'Design review',
            });
            timeEntryRepository.create.mockResolvedValue(created);

            const result = await service.createManualEntry(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(created);
            expect(timeEntryRepository.create).toHaveBeenCalledWith({
                taskId,
                userId,
                entryType: TimeEntryType.MANUAL,
                durationMinutes: 90,
                description: 'Design review',
                startedAt: null,
                endedAt: null,
            });
        });

        it('should set description to null when not provided', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());

            const dto: CreateManualTimeEntryDto = { durationMinutes: 30 };
            timeEntryRepository.create.mockResolvedValue(createMockTimeEntry());

            await service.createManualEntry(userId, projectId, taskId, dto);

            expect(timeEntryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ description: null }),
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            const dto: CreateManualTimeEntryDto = { durationMinutes: 60 };

            await expect(
                service.createManualEntry(userId, projectId, taskId, dto),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── startTimer ──────────────────────────────────────────────────

    describe('startTimer', () => {
        it('should create a TIMER entry with startedAt set to current time', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            timeEntryRepository.findActiveTimer.mockResolvedValue(null);

            const created = createMockTimeEntry({
                entryType: TimeEntryType.TIMER,
                durationMinutes: 0,
                startedAt: new Date(),
                endedAt: null,
            });
            timeEntryRepository.create.mockResolvedValue(created);

            const result = await service.startTimer(userId, projectId, taskId);

            expect(result).toEqual(created);
            expect(timeEntryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    taskId,
                    userId,
                    entryType: TimeEntryType.TIMER,
                    durationMinutes: 0,
                    endedAt: null,
                    description: null,
                }),
            );
            // startedAt should be a Date
            const createArg = timeEntryRepository.create.mock.calls[0][0];
            expect(createArg.startedAt).toBeInstanceOf(Date);
        });

        it('should throw BadRequestException when user already has an active timer on this task', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            timeEntryRepository.findActiveTimer.mockResolvedValue(
                createMockTimeEntry({
                    entryType: TimeEntryType.TIMER,
                    endedAt: null,
                }),
            );

            await expect(
                service.startTimer(userId, projectId, taskId),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            await expect(
                service.startTimer(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── stopTimer ───────────────────────────────────────────────────

    describe('stopTimer', () => {
        const timeEntryId = 'entry-1';

        it('should stop a running timer and calculate duration', async () => {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const timerEntry = createMockTimeEntry({
                id: timeEntryId,
                userId,
                entryType: TimeEntryType.TIMER,
                startedAt: tenMinutesAgo,
                endedAt: null,
            });
            timeEntryRepository.findById.mockResolvedValue(timerEntry);

            const stoppedEntry = createMockTimeEntry({
                id: timeEntryId,
                endedAt: new Date(),
                durationMinutes: 10,
            });
            timeEntryRepository.update.mockResolvedValue(stoppedEntry);

            const result = await service.stopTimer(userId, timeEntryId);

            expect(result).toEqual(stoppedEntry);
            expect(timeEntryRepository.update).toHaveBeenCalledWith(
                timeEntryId,
                expect.objectContaining({
                    endedAt: expect.any(Date),
                    durationMinutes: expect.any(Number),
                }),
            );
            // Duration should be at least 1 minute (minimum enforcement)
            const updateArg = timeEntryRepository.update.mock.calls[0][1];
            expect(updateArg.durationMinutes).toBeGreaterThanOrEqual(1);
        });

        it('should enforce minimum duration of 1 minute', async () => {
            const justNow = new Date(Date.now() - 5 * 1000); // 5 seconds ago
            const timerEntry = createMockTimeEntry({
                id: timeEntryId,
                userId,
                entryType: TimeEntryType.TIMER,
                startedAt: justNow,
                endedAt: null,
            });
            timeEntryRepository.findById.mockResolvedValue(timerEntry);
            timeEntryRepository.update.mockResolvedValue(
                createMockTimeEntry({ durationMinutes: 1 }),
            );

            await service.stopTimer(userId, timeEntryId);

            const updateArg = timeEntryRepository.update.mock.calls[0][1];
            expect(updateArg.durationMinutes).toBe(1);
        });

        it('should throw NotFoundException when time entry does not exist', async () => {
            timeEntryRepository.findById.mockResolvedValue(null);

            await expect(
                service.stopTimer(userId, timeEntryId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the timer owner', async () => {
            timeEntryRepository.findById.mockResolvedValue(
                createMockTimeEntry({
                    id: timeEntryId,
                    userId: 'other-user',
                    entryType: TimeEntryType.TIMER,
                }),
            );

            await expect(
                service.stopTimer(userId, timeEntryId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when entry is not a TIMER type', async () => {
            timeEntryRepository.findById.mockResolvedValue(
                createMockTimeEntry({
                    id: timeEntryId,
                    userId,
                    entryType: TimeEntryType.MANUAL,
                }),
            );

            await expect(
                service.stopTimer(userId, timeEntryId),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when timer has already been stopped', async () => {
            timeEntryRepository.findById.mockResolvedValue(
                createMockTimeEntry({
                    id: timeEntryId,
                    userId,
                    entryType: TimeEntryType.TIMER,
                    endedAt: new Date(),
                }),
            );

            await expect(
                service.stopTimer(userId, timeEntryId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── updateTimeEntry ─────────────────────────────────────────────

    describe('updateTimeEntry', () => {
        const timeEntryId = 'entry-1';

        it('should update duration and description when user is the owner', async () => {
            const entry = createMockTimeEntry({ id: timeEntryId, userId });
            timeEntryRepository.findById.mockResolvedValue(entry);

            const updatedEntry = createMockTimeEntry({
                id: timeEntryId,
                durationMinutes: 120,
                description: 'Updated description',
            });
            timeEntryRepository.update.mockResolvedValue(updatedEntry);

            const dto: UpdateTimeEntryDto = {
                durationMinutes: 120,
                description: 'Updated description',
            };

            const result = await service.updateTimeEntry(
                userId,
                timeEntryId,
                dto,
            );

            expect(result).toEqual(updatedEntry);
            expect(timeEntryRepository.update).toHaveBeenCalledWith(
                timeEntryId,
                { durationMinutes: 120, description: 'Updated description' },
            );
        });

        it('should update only duration when description is not provided', async () => {
            const entry = createMockTimeEntry({ id: timeEntryId, userId });
            timeEntryRepository.findById.mockResolvedValue(entry);
            timeEntryRepository.update.mockResolvedValue(
                createMockTimeEntry({ durationMinutes: 45 }),
            );

            const dto: UpdateTimeEntryDto = { durationMinutes: 45 };

            await service.updateTimeEntry(userId, timeEntryId, dto);

            expect(timeEntryRepository.update).toHaveBeenCalledWith(
                timeEntryId,
                { durationMinutes: 45 },
            );
        });

        it('should throw NotFoundException when time entry does not exist', async () => {
            timeEntryRepository.findById.mockResolvedValue(null);

            const dto: UpdateTimeEntryDto = { durationMinutes: 30 };

            await expect(
                service.updateTimeEntry(userId, timeEntryId, dto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the entry owner', async () => {
            timeEntryRepository.findById.mockResolvedValue(
                createMockTimeEntry({ id: timeEntryId, userId: 'other-user' }),
            );

            const dto: UpdateTimeEntryDto = { durationMinutes: 30 };

            await expect(
                service.updateTimeEntry(userId, timeEntryId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should return the original entry when update returns null', async () => {
            const entry = createMockTimeEntry({ id: timeEntryId, userId });
            timeEntryRepository.findById.mockResolvedValue(entry);
            timeEntryRepository.update.mockResolvedValue(null);

            const dto: UpdateTimeEntryDto = { description: 'New description' };

            const result = await service.updateTimeEntry(
                userId,
                timeEntryId,
                dto,
            );

            expect(result).toEqual(entry);
        });
    });

    // ─── deleteTimeEntry ─────────────────────────────────────────────

    describe('deleteTimeEntry', () => {
        const timeEntryId = 'entry-1';

        it('should delete the time entry when user is the owner', async () => {
            const entry = createMockTimeEntry({ id: timeEntryId, userId });
            timeEntryRepository.findById.mockResolvedValue(entry);
            timeEntryRepository.delete.mockResolvedValue(true);

            await service.deleteTimeEntry(userId, timeEntryId);

            expect(timeEntryRepository.delete).toHaveBeenCalledWith(
                timeEntryId,
            );
        });

        it('should throw NotFoundException when time entry does not exist', async () => {
            timeEntryRepository.findById.mockResolvedValue(null);

            await expect(
                service.deleteTimeEntry(userId, timeEntryId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the entry owner', async () => {
            timeEntryRepository.findById.mockResolvedValue(
                createMockTimeEntry({ id: timeEntryId, userId: 'other-user' }),
            );

            await expect(
                service.deleteTimeEntry(userId, timeEntryId),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
