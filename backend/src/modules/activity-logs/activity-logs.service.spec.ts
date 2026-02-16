import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLog } from './activity-log.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ActivityAction } from '@shared/enums';
import { PaginationDto } from '@shared/dtos';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const createMockActivityLog = (
    overrides: Partial<ActivityLog> = {},
): ActivityLog =>
    ({
        id: 'log-1',
        projectId: 'project-1',
        taskId: 'task-1',
        userId: 'user-1',
        action: ActivityAction.TASK_CREATED,
        details: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as unknown as ActivityLog;

const createMockMember = (): ProjectMember =>
    ({
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
    }) as unknown as ProjectMember;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('ActivityLogsService', () => {
    let service: ActivityLogsService;
    let activityLogRepository: Record<string, jest.Mock>;
    let memberRepo: { findOne: jest.Mock };

    beforeEach(async () => {
        activityLogRepository = {
            create: jest.fn(),
            findByProject: jest.fn(),
            findById: jest.fn(),
        };

        memberRepo = { findOne: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActivityLogsService,
                {
                    provide: ActivityLogRepository,
                    useValue: activityLogRepository,
                },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepo,
                },
            ],
        }).compile();

        service = module.get<ActivityLogsService>(ActivityLogsService);
    });

    const userId = 'user-1';
    const projectId = 'project-1';

    // ─── logActivity ─────────────────────────────────────────────────

    describe('logActivity', () => {
        it('should create an activity log entry with all fields', async () => {
            const log = createMockActivityLog({
                action: ActivityAction.TASK_MOVED,
                taskId: 'task-1',
                details: { fromColumn: 'To Do', toColumn: 'In Progress' },
            });
            activityLogRepository.create.mockResolvedValue(log);

            const result = await service.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_MOVED,
                'task-1',
                { fromColumn: 'To Do', toColumn: 'In Progress' },
            );

            expect(result).toEqual(log);
            expect(activityLogRepository.create).toHaveBeenCalledWith({
                projectId,
                userId,
                action: ActivityAction.TASK_MOVED,
                taskId: 'task-1',
                details: { fromColumn: 'To Do', toColumn: 'In Progress' },
            });
        });

        it('should create an activity log entry with null userId', async () => {
            const log = createMockActivityLog({ userId: null });
            activityLogRepository.create.mockResolvedValue(log);

            await service.logActivity(
                projectId,
                null,
                ActivityAction.TASK_CREATED,
            );

            expect(activityLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: null }),
            );
        });

        it('should create an activity log entry without optional taskId', async () => {
            const log = createMockActivityLog({
                taskId: null,
                action: ActivityAction.PROJECT_UPDATED,
            });
            activityLogRepository.create.mockResolvedValue(log);

            await service.logActivity(
                projectId,
                userId,
                ActivityAction.PROJECT_UPDATED,
            );

            expect(activityLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ taskId: null, details: null }),
            );
        });

        it('should create an activity log entry without optional details', async () => {
            const log = createMockActivityLog({ details: null });
            activityLogRepository.create.mockResolvedValue(log);

            await service.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_CREATED,
                'task-1',
            );

            expect(activityLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ details: null }),
            );
        });

        it('should handle all ActivityAction enum values', async () => {
            activityLogRepository.create.mockResolvedValue(
                createMockActivityLog(),
            );

            for (const action of Object.values(ActivityAction)) {
                await service.logActivity(projectId, userId, action);

                expect(activityLogRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({ action }),
                );
            }
        });
    });

    // ─── getProjectActivity ──────────────────────────────────────────

    describe('getProjectActivity', () => {
        it('should return paginated activity logs when user is a member', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());

            const logs = [
                createMockActivityLog(),
                createMockActivityLog({
                    id: 'log-2',
                    action: ActivityAction.TASK_MOVED,
                }),
            ];
            activityLogRepository.findByProject.mockResolvedValue({
                data: logs,
                total: 2,
            });

            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = await service.getProjectActivity(
                userId,
                projectId,
                pagination,
            );

            expect(result).toEqual({
                data: logs,
                total: 2,
                page: 1,
                limit: 10,
            });
            expect(activityLogRepository.findByProject).toHaveBeenCalledWith(
                projectId,
                1,
                10,
            );
        });

        it('should use default page=1 and limit=10 when not provided', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            activityLogRepository.findByProject.mockResolvedValue({
                data: [],
                total: 0,
            });

            const pagination: PaginationDto = {};
            const result = await service.getProjectActivity(
                userId,
                projectId,
                pagination,
            );

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(activityLogRepository.findByProject).toHaveBeenCalledWith(
                projectId,
                1,
                10,
            );
        });

        it('should respect custom pagination parameters', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            activityLogRepository.findByProject.mockResolvedValue({
                data: [],
                total: 50,
            });

            const pagination: PaginationDto = { page: 3, limit: 25 };
            const result = await service.getProjectActivity(
                userId,
                projectId,
                pagination,
            );

            expect(result.page).toBe(3);
            expect(result.limit).toBe(25);
            expect(activityLogRepository.findByProject).toHaveBeenCalledWith(
                projectId,
                3,
                25,
            );
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            const pagination: PaginationDto = { page: 1, limit: 10 };

            await expect(
                service.getProjectActivity(userId, projectId, pagination),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should return empty data array when project has no activity', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            activityLogRepository.findByProject.mockResolvedValue({
                data: [],
                total: 0,
            });

            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = await service.getProjectActivity(
                userId,
                projectId,
                pagination,
            );

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
        });
    });
});
