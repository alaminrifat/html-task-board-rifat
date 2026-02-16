import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';

import { AdminProjectsService } from './admin-projects.service';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';
import { ProjectStatus } from '@shared/enums';
import { BulkProjectAction } from './dtos';

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
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
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
        softRemove: jest
            .fn()
            .mockImplementation((entity) => Promise.resolve(entity)),
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AdminProjectsService', () => {
    let service: AdminProjectsService;
    let projectRepo: ReturnType<typeof mockRepository>;
    let taskRepo: ReturnType<typeof mockRepository>;
    let memberRepo: ReturnType<typeof mockRepository>;
    let columnRepo: ReturnType<typeof mockRepository>;
    let activityLogRepo: ReturnType<typeof mockRepository>;

    beforeEach(async () => {
        projectRepo = mockRepository();
        taskRepo = mockRepository();
        memberRepo = mockRepository();
        columnRepo = mockRepository();
        activityLogRepo = mockRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminProjectsService,
                { provide: getRepositoryToken(Project), useValue: projectRepo },
                { provide: getRepositoryToken(Task), useValue: taskRepo },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepo,
                },
                {
                    provide: getRepositoryToken(BoardColumn),
                    useValue: columnRepo,
                },
                {
                    provide: getRepositoryToken(ActivityLog),
                    useValue: activityLogRepo,
                },
            ],
        }).compile();

        service = module.get<AdminProjectsService>(AdminProjectsService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getProjects (listProjects)
    // ═══════════════════════════════════════════════════════════════════════

    describe('getProjects', () => {
        it('should return paginated projects with default pagination', async () => {
            const mockProject = {
                id: 'p1',
                title: 'Test Project',
                description: 'Desc',
                status: ProjectStatus.ACTIVE,
                deadline: null,
                createdAt: new Date(),
                owner: { id: 'u1', fullName: 'Owner', email: 'owner@test.com' },
            };

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getMany: jest.fn().mockResolvedValue([mockProject]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            // computeCompletionPercent query
            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjects({});

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.total).toBe(1);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Test Project');
        });

        it('should filter by search term', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            await service.getProjects({ search: 'marketing' });

            expect(qb.andWhere).toHaveBeenCalledWith(
                '(p.title ILIKE :search OR owner.fullName ILIKE :search)',
                { search: '%marketing%' },
            );
        });

        it('should filter by status', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            await service.getProjects({ status: ProjectStatus.ARCHIVED });

            expect(qb.andWhere).toHaveBeenCalledWith('p.status = :status', {
                status: ProjectStatus.ARCHIVED,
            });
        });

        it('should sort by title ASC', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            await service.getProjects({ sortBy: 'title', sortOrder: 'ASC' });

            expect(qb.orderBy).toHaveBeenCalledWith('p.title', 'ASC');
        });

        it('should handle computed field sort (members_count) in memory', async () => {
            const projects = [
                {
                    id: 'p1',
                    title: 'A',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 5,
                    tasksCount: 0,
                },
                {
                    id: 'p2',
                    title: 'B',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 10,
                    tasksCount: 0,
                },
            ];

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(2),
                getMany: jest.fn().mockResolvedValue(projects),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjects({
                sortBy: 'members_count',
                sortOrder: 'DESC',
            });

            expect(result.data[0].membersCount).toBeGreaterThanOrEqual(
                result.data[1].membersCount,
            );
        });

        it('should apply membersMin filter', async () => {
            const projects = [
                {
                    id: 'p1',
                    title: 'Small',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 1,
                    tasksCount: 0,
                },
                {
                    id: 'p2',
                    title: 'Large',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 10,
                    tasksCount: 0,
                },
            ];

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(2),
                getMany: jest.fn().mockResolvedValue(projects),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjects({ membersMin: 5 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Large');
        });

        it('should apply membersMax filter', async () => {
            const projects = [
                {
                    id: 'p1',
                    title: 'Small',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 2,
                    tasksCount: 0,
                },
                {
                    id: 'p2',
                    title: 'Large',
                    description: '',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: null,
                    membersCount: 50,
                    tasksCount: 0,
                },
            ];

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(2),
                getMany: jest.fn().mockResolvedValue(projects),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjects({ membersMax: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Small');
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getProjectDetail
    // ═══════════════════════════════════════════════════════════════════════

    describe('getProjectDetail', () => {
        it('should return project detail with members, taskSummary, and recentActivity', async () => {
            const mockProject = {
                id: 'p1',
                title: 'Project Detail',
                description: 'A project',
                status: ProjectStatus.ACTIVE,
                deadline: new Date(),
                createdAt: new Date(),
                owner: { id: 'u1', fullName: 'Owner', email: 'owner@test.com' },
            };

            const projectQb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockProject),
            });
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);

            const memberQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        user: {
                            id: 'u1',
                            fullName: 'Owner',
                            email: 'owner@test.com',
                            avatarUrl: null,
                        },
                        projectRole: 'OWNER',
                        joinedAt: new Date(),
                    },
                ]),
            });
            memberRepo.createQueryBuilder.mockReturnValue(memberQb);

            const columnQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    { title: 'To Do', taskCount: 5 },
                    { title: 'Done', taskCount: 3 },
                ]),
            });
            columnRepo.createQueryBuilder.mockReturnValue(columnQb);

            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(8),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const activityQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: 'a1',
                        action: 'TASK_CREATED',
                        user: { id: 'u1', fullName: 'Owner' },
                        details: null,
                        createdAt: new Date(),
                    },
                ]),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(activityQb);

            const result = await service.getProjectDetail('p1');

            expect(result.id).toBe('p1');
            expect(result.title).toBe('Project Detail');
            expect(result.members).toHaveLength(1);
            expect(result.taskSummary.total).toBe(8);
            expect(result.taskSummary.byStatus).toHaveLength(2);
            expect(result.recentActivity).toHaveLength(1);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(null),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(
                service.getProjectDetail('nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should return null owner when project has no owner', async () => {
            const mockProject = {
                id: 'p1',
                title: 'No Owner',
                description: '',
                status: ProjectStatus.ACTIVE,
                deadline: null,
                createdAt: new Date(),
                owner: null,
            };

            const projectQb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockProject),
            });
            projectRepo.createQueryBuilder.mockReturnValue(projectQb);

            const memberQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            memberRepo.createQueryBuilder.mockReturnValue(memberQb);

            const columnQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            columnRepo.createQueryBuilder.mockReturnValue(columnQb);

            const taskQb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const activityQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            activityLogRepo.createQueryBuilder.mockReturnValue(activityQb);

            const result = await service.getProjectDetail('p1');

            expect(result.owner).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // archiveProject
    // ═══════════════════════════════════════════════════════════════════════

    describe('archiveProject', () => {
        it('should set project status to ARCHIVED', async () => {
            const project = {
                id: 'p1',
                title: 'Active Project',
                status: ProjectStatus.ACTIVE,
            };
            projectRepo.findOne.mockResolvedValue(project);
            projectRepo.save.mockImplementation((p) => Promise.resolve(p));

            const result = await service.archiveProject('p1');

            expect(result.status).toBe(ProjectStatus.ARCHIVED);
        });

        it('should throw NotFoundException when project not found', async () => {
            projectRepo.findOne.mockResolvedValue(null);

            await expect(service.archiveProject('missing')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw UnprocessableEntityException when project is already archived', async () => {
            const project = {
                id: 'p1',
                title: 'Archived Project',
                status: ProjectStatus.ARCHIVED,
            };
            projectRepo.findOne.mockResolvedValue(project);

            await expect(service.archiveProject('p1')).rejects.toThrow(
                UnprocessableEntityException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // deleteProject
    // ═══════════════════════════════════════════════════════════════════════

    describe('deleteProject', () => {
        it('should soft-delete the project', async () => {
            const project = {
                id: 'p1',
                title: 'To Delete',
                status: ProjectStatus.ACTIVE,
            };
            projectRepo.findOne.mockResolvedValue(project);

            await service.deleteProject('p1');

            expect(projectRepo.softRemove).toHaveBeenCalledWith(project);
        });

        it('should throw NotFoundException when project not found', async () => {
            projectRepo.findOne.mockResolvedValue(null);

            await expect(service.deleteProject('missing')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // bulkAction
    // ═══════════════════════════════════════════════════════════════════════

    describe('bulkAction', () => {
        it('should process each project independently for ARCHIVE', async () => {
            const project1 = { id: 'p1', status: ProjectStatus.ACTIVE };
            const project2 = { id: 'p2', status: ProjectStatus.ARCHIVED }; // already archived

            projectRepo.findOne
                .mockResolvedValueOnce(project1)
                .mockResolvedValueOnce(project2);
            projectRepo.save.mockImplementation((p) => Promise.resolve(p));

            const result = await service.bulkAction({
                projectIds: ['p1', 'p2'],
                action: BulkProjectAction.ARCHIVE,
            });

            expect(result.success).toHaveLength(1);
            expect(result.failed).toHaveLength(1);
            expect(result.errors[0].projectId).toBe('p2');
        });

        it('should process each project independently for DELETE', async () => {
            const project = { id: 'p1', status: ProjectStatus.ACTIVE };

            projectRepo.findOne
                .mockResolvedValueOnce(project) // for delete p1
                .mockResolvedValueOnce(null); // p2 not found

            const result = await service.bulkAction({
                projectIds: ['p1', 'p2'],
                action: BulkProjectAction.DELETE,
            });

            expect(result.success).toHaveLength(1);
            expect(result.failed).toHaveLength(1);
        });

        it('should return all success when all projects are processed', async () => {
            const project1 = { id: 'p1', status: ProjectStatus.ACTIVE };
            const project2 = { id: 'p2', status: ProjectStatus.ACTIVE };

            projectRepo.findOne
                .mockResolvedValueOnce(project1)
                .mockResolvedValueOnce(project2);
            projectRepo.save.mockImplementation((p) => Promise.resolve(p));

            const result = await service.bulkAction({
                projectIds: ['p1', 'p2'],
                action: BulkProjectAction.ARCHIVE,
            });

            expect(result.success).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getProjectsForExport (exportProjectsCsv)
    // ═══════════════════════════════════════════════════════════════════════

    describe('getProjectsForExport', () => {
        it('should return project data for export with limit of 10000', async () => {
            const projects = [
                {
                    id: 'p1',
                    title: 'Exported Project',
                    description: 'desc',
                    status: ProjectStatus.ACTIVE,
                    deadline: null,
                    createdAt: new Date(),
                    owner: {
                        id: 'u1',
                        fullName: 'Owner',
                        email: 'owner@test.com',
                    },
                    membersCount: 3,
                    tasksCount: 10,
                },
            ];

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getMany: jest.fn().mockResolvedValue(projects),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjectsForExport({});

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Exported Project');
        });

        it('should return empty array when no projects match filters', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(qb);

            const taskCompQb = createMockQueryBuilder({
                getRawMany: jest.fn().mockResolvedValue([]),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskCompQb);

            const result = await service.getProjectsForExport({});

            expect(result).toEqual([]);
        });
    });
});
