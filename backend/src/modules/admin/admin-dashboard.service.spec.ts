import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdminDashboardService } from './admin-dashboard.service';
import { User } from '@modules/users/user.entity';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';
import { BoardColumn } from '@modules/columns/column.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockQueryBuilder(overrides: Record<string, any> = {}) {
    const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
        getRawAndEntities: jest
            .fn()
            .mockResolvedValue({ entities: [], raw: [] }),
        getRawOne: jest.fn().mockResolvedValue(null),
        getRawMany: jest.fn().mockResolvedValue([]),
        ...overrides,
    };
    return qb;
}

function mockRepository() {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AdminDashboardService', () => {
    let service: AdminDashboardService;
    let userRepo: ReturnType<typeof mockRepository>;
    let projectRepo: ReturnType<typeof mockRepository>;
    let taskRepo: ReturnType<typeof mockRepository>;
    let activityLogRepo: ReturnType<typeof mockRepository>;
    let columnRepo: ReturnType<typeof mockRepository>;

    beforeEach(async () => {
        userRepo = mockRepository();
        projectRepo = mockRepository();
        taskRepo = mockRepository();
        activityLogRepo = mockRepository();
        columnRepo = mockRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminDashboardService,
                { provide: getRepositoryToken(User), useValue: userRepo },
                { provide: getRepositoryToken(Project), useValue: projectRepo },
                { provide: getRepositoryToken(Task), useValue: taskRepo },
                {
                    provide: getRepositoryToken(ActivityLog),
                    useValue: activityLogRepo,
                },
                {
                    provide: getRepositoryToken(BoardColumn),
                    useValue: columnRepo,
                },
            ],
        }).compile();

        service = module.get<AdminDashboardService>(AdminDashboardService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getStats
    // ═══════════════════════════════════════════════════════════════════════

    describe('getStats', () => {
        it('should return totalUsers, totalProjects, totalTasks, activeUsersToday with default period', async () => {
            const userQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(50),
            });
            const projectQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(10),
            });
            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(200),
            });
            const activeQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(25),
            });

            userRepo.createQueryBuilder
                .mockReturnValueOnce(userQb)
                .mockReturnValueOnce(activeQb);
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const result = await service.getStats({});

            expect(result.totalUsers).toBe(50);
            expect(result.totalProjects).toBe(10);
            expect(result.totalTasks).toBe(200);
            expect(result.activeUsersToday).toBe(25);
            expect(result.period).toBeDefined();
            expect(result.period.type).toBe('30d');
        });

        it('should use "today" period filter', async () => {
            const userQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(5),
            });
            const projectQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
            });
            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(20),
            });
            const activeQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(3),
            });

            userRepo.createQueryBuilder
                .mockReturnValueOnce(userQb)
                .mockReturnValueOnce(activeQb);
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const result = await service.getStats({ period: 'today' });

            expect(result.period.type).toBe('today');
        });

        it('should use "7d" period filter', async () => {
            const userQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(10),
            });
            const projectQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(2),
            });
            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(50),
            });
            const activeQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(8),
            });

            userRepo.createQueryBuilder
                .mockReturnValueOnce(userQb)
                .mockReturnValueOnce(activeQb);
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const result = await service.getStats({ period: '7d' });

            expect(result.period.type).toBe('7d');
        });

        it('should use "custom" period with dateFrom and dateTo', async () => {
            const userQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });
            const projectQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });
            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });
            const activeQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });

            userRepo.createQueryBuilder
                .mockReturnValueOnce(userQb)
                .mockReturnValueOnce(activeQb);
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const result = await service.getStats({
                period: 'custom',
                dateFrom: '2024-01-01',
                dateTo: '2024-06-30',
            });

            expect(result.period.type).toBe('custom');
        });

        it('should return zero counts when no data', async () => {
            const emptyQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });

            userRepo.createQueryBuilder.mockReturnValue(emptyQb);
            projectRepo.createQueryBuilder.mockReturnValue(emptyQb);
            taskRepo.createQueryBuilder.mockReturnValue(emptyQb);

            const result = await service.getStats({});

            expect(result.totalUsers).toBe(0);
            expect(result.totalProjects).toBe(0);
            expect(result.totalTasks).toBe(0);
            expect(result.activeUsersToday).toBe(0);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getCharts
    // ═══════════════════════════════════════════════════════════════════════

    describe('getCharts', () => {
        it('should return trend data with userRegistration, projectCreation, taskCompletion, top5', async () => {
            const userTrendQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([
                    { date: '2024-06-01', count: '5' },
                    { date: '2024-06-02', count: '3' },
                ]),
            });
            const projectTrendQb = createMockQueryBuilder({
                getRawMany: jest
                    .fn()
                    .mockResolvedValue([{ date: '2024-06-01', count: '2' }]),
            });
            const taskCompletionQb = createMockQueryBuilder({
                getRawMany: jest
                    .fn()
                    .mockResolvedValue([
                        { date: '2024-06-01', total: '10', completed: '7' },
                    ]),
            });
            const topProjectsQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([
                    {
                        projectId: 'p1',
                        projectTitle: 'Project Alpha',
                        activityCount: '42',
                    },
                ]),
            });

            userRepo.createQueryBuilder.mockReturnValue(userTrendQb);
            projectRepo.createQueryBuilder.mockReturnValue(projectTrendQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskCompletionQb);
            activityLogRepo.createQueryBuilder.mockReturnValue(topProjectsQb);

            const result = await service.getCharts({});

            expect(result.userRegistrationTrend).toHaveLength(2);
            expect(result.userRegistrationTrend[0].count).toBe(5);
            expect(result.projectCreationTrend).toHaveLength(1);
            expect(result.taskCompletionRate).toHaveLength(1);
            expect(result.taskCompletionRate[0].rate).toBe(70);
            expect(result.top5ActiveProjects).toHaveLength(1);
            expect(result.top5ActiveProjects[0].activityCount).toBe(42);
            expect(result.period).toBeDefined();
        });

        it('should return empty arrays when no data exists', async () => {
            const emptyQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });

            userRepo.createQueryBuilder.mockReturnValue(emptyQb);
            projectRepo.createQueryBuilder.mockReturnValue(emptyQb);
            taskRepo.createQueryBuilder.mockReturnValue(emptyQb);
            activityLogRepo.createQueryBuilder.mockReturnValue(emptyQb);

            const result = await service.getCharts({});

            expect(result.userRegistrationTrend).toEqual([]);
            expect(result.projectCreationTrend).toEqual([]);
            expect(result.taskCompletionRate).toEqual([]);
            expect(result.top5ActiveProjects).toEqual([]);
        });

        it('should calculate completion rate as 0 when total is 0', async () => {
            const emptyTrendQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            const taskCompletionQb = createMockQueryBuilder({
                getRawMany: jest
                    .fn()
                    .mockResolvedValue([
                        { date: '2024-06-01', total: '0', completed: '0' },
                    ]),
            });

            userRepo.createQueryBuilder.mockReturnValue(emptyTrendQb);
            projectRepo.createQueryBuilder.mockReturnValue(emptyTrendQb);
            taskRepo.createQueryBuilder.mockReturnValue(taskCompletionQb);
            activityLogRepo.createQueryBuilder.mockReturnValue(emptyTrendQb);

            const result = await service.getCharts({});

            expect(result.taskCompletionRate[0].rate).toBe(0);
        });

        it('should include period information in response', async () => {
            const emptyQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });

            userRepo.createQueryBuilder.mockReturnValue(emptyQb);
            projectRepo.createQueryBuilder.mockReturnValue(emptyQb);
            taskRepo.createQueryBuilder.mockReturnValue(emptyQb);
            activityLogRepo.createQueryBuilder.mockReturnValue(emptyQb);

            const result = await service.getCharts({ period: '7d' });

            expect(result.period.type).toBe('7d');
            expect(result.period.from).toBeDefined();
            expect(result.period.to).toBeDefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getRecentActivity
    // ═══════════════════════════════════════════════════════════════════════

    describe('getRecentActivity', () => {
        it('should return latest 10 activities across all projects', async () => {
            const mockActivities = [
                {
                    id: 'a1',
                    action: 'TASK_CREATED',
                    user: {
                        id: 'u1',
                        fullName: 'John',
                        avatarUrl: 'https://img.com/john.png',
                    },
                    project: { id: 'p1', title: 'Project 1' },
                    taskId: 't1',
                    task: { id: 't1', title: 'Task 1' },
                    details: { key: 'value' },
                    createdAt: new Date(),
                },
                {
                    id: 'a2',
                    action: 'TASK_MOVED',
                    user: null,
                    project: { id: 'p2', title: 'Project 2' },
                    taskId: null,
                    task: null,
                    details: null,
                    createdAt: new Date(),
                },
            ];

            const qb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue(mockActivities),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getRecentActivity();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('a1');
            expect(result[0].user).toEqual({
                id: 'u1',
                name: 'John',
                avatarUrl: 'https://img.com/john.png',
            });
            expect(result[0].project).toEqual({ id: 'p1', title: 'Project 1' });
            expect(result[0].taskTitle).toBe('Task 1');
            expect(result[1].user).toBeNull();
            expect(result[1].taskTitle).toBeNull();
        });

        it('should return empty array when no activities exist', async () => {
            const qb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getRecentActivity();

            expect(result).toEqual([]);
        });

        it('should limit results to 10 entries', async () => {
            const qb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getRecentActivity();

            expect(qb.limit).toHaveBeenCalledWith(10);
        });

        it('should order by createdAt DESC', async () => {
            const qb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getRecentActivity();

            expect(qb.orderBy).toHaveBeenCalledWith('al.createdAt', 'DESC');
        });

        it('should handle activity with user that has no avatarUrl', async () => {
            const mockActivities = [
                {
                    id: 'a1',
                    action: 'COMMENT_ADDED',
                    user: { id: 'u1', fullName: 'Jane' },
                    project: { id: 'p1', title: 'Project 1' },
                    taskId: null,
                    task: null,
                    details: null,
                    createdAt: new Date(),
                },
            ];

            const qb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue(mockActivities),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getRecentActivity();

            expect(result[0].user!.avatarUrl).toBeNull();
        });
    });
});
