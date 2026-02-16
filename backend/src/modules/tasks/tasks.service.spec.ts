import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { Label } from '@modules/labels/label.entity';
import { I18nHelper } from '@core/utils/i18n.helper';
import { ProjectRole, TaskPriority } from '@shared/enums';
import {
    CreateTaskDto,
    MoveTaskDto,
    TaskFilterDto,
    UpdateTaskDto,
} from './dtos';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
        id: 'task-1',
        projectId: 'project-1',
        columnId: 'column-1',
        creatorId: 'user-1',
        assigneeId: null,
        title: 'Test Task',
        description: null,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        position: 0,
        deletedById: null,
        deletedAt: undefined,
        labels: [],
        assignee: null,
        creator: null,
        column: null,
        subTasks: [],
        comments: [],
        attachments: [],
        timeEntries: [],
        ...overrides,
    }) as unknown as Task;

const createMockMember = (
    overrides: Partial<ProjectMember> = {},
): ProjectMember =>
    ({
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
        projectRole: ProjectRole.MEMBER,
        joinedAt: new Date(),
        ...overrides,
    }) as unknown as ProjectMember;

const createMockColumn = (overrides: Partial<BoardColumn> = {}): BoardColumn =>
    ({
        id: 'column-1',
        projectId: 'project-1',
        title: 'To Do',
        position: 0,
        wipLimit: null,
        ...overrides,
    }) as unknown as BoardColumn;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('TasksService', () => {
    let service: TasksService;
    let taskRepository: jest.Mocked<TaskRepository>;
    let memberRepo: { findOne: jest.Mock };
    let columnRepo: { findOne: jest.Mock };
    let labelRepo: { find: jest.Mock };
    let dataSource: { transaction: jest.Mock; createQueryRunner: jest.Mock };
    let i18nHelper: { t: jest.Mock };

    beforeEach(async () => {
        taskRepository = {
            findByProjectWithFilters: jest.fn(),
            findTaskWithDetails: jest.fn(),
            findById: jest.fn(),
            getMaxPositionInColumn: jest.fn(),
            getTaskCountInColumn: jest.fn(),
            findTrashedByProject: jest.fn(),
            findTrashedById: jest.fn(),
            permanentDelete: jest.fn(),
            shiftPositionsUp: jest.fn(),
            findTasksByAssignee: jest.fn(),
        } as any;

        memberRepo = { findOne: jest.fn() };
        columnRepo = { findOne: jest.fn() };
        labelRepo = { find: jest.fn() };

        dataSource = {
            transaction: jest.fn(),
            createQueryRunner: jest.fn(),
        };

        i18nHelper = {
            t: jest.fn().mockReturnValue('translated message'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: TaskRepository, useValue: taskRepository },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepo,
                },
                {
                    provide: getRepositoryToken(BoardColumn),
                    useValue: columnRepo,
                },
                { provide: getRepositoryToken(Label), useValue: labelRepo },
                { provide: DataSource, useValue: dataSource },
                { provide: I18nHelper, useValue: i18nHelper },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
    });

    // ─── getTasks ────────────────────────────────────────────────────

    describe('getTasks', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const filters: TaskFilterDto = { page: 1, limit: 10 };

        it('should return paginated tasks when user is a member', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            const tasks = [createMockTask()];
            taskRepository.findByProjectWithFilters.mockResolvedValue({
                data: tasks,
                total: 1,
            });

            const result = await service.getTasks(userId, projectId, filters);

            expect(result).toEqual({
                data: tasks,
                total: 1,
                page: 1,
                limit: 10,
            });
            expect(memberRepo.findOne).toHaveBeenCalledWith({
                where: { projectId, userId },
            });
            expect(
                taskRepository.findByProjectWithFilters,
            ).toHaveBeenCalledWith(projectId, filters);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getTasks(userId, projectId, filters),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should use default page=1 and limit=10 when filters do not provide them', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findByProjectWithFilters.mockResolvedValue({
                data: [],
                total: 0,
            });

            const result = await service.getTasks(userId, projectId, {});

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should pass filter parameters to the repository', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findByProjectWithFilters.mockResolvedValue({
                data: [],
                total: 0,
            });

            const filterWithOptions: TaskFilterDto = {
                priority: TaskPriority.HIGH,
                assigneeId: 'user-2',
                labelId: 'label-1',
                search: 'test',
                page: 2,
                limit: 5,
            };

            await service.getTasks(userId, projectId, filterWithOptions);

            expect(
                taskRepository.findByProjectWithFilters,
            ).toHaveBeenCalledWith(projectId, filterWithOptions);
        });
    });

    // ─── createTask ──────────────────────────────────────────────────

    describe('createTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const dto: CreateTaskDto = {
            title: 'New Task',
            columnId: 'column-1',
            priority: TaskPriority.HIGH,
        };

        it('should create a task with the correct position', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(createMockColumn());
            taskRepository.getMaxPositionInColumn.mockResolvedValue(2);
            taskRepository.getTaskCountInColumn.mockResolvedValue(1);
            labelRepo.find.mockResolvedValue([]);

            const savedTask = createMockTask({ position: 3 });
            const mockManager = {
                create: jest.fn().mockReturnValue(savedTask),
                save: jest.fn().mockResolvedValue(savedTask),
                findOne: jest.fn().mockResolvedValue(savedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const result = await service.createTask(userId, projectId, dto);

            expect(result).toEqual(savedTask);
            expect(mockManager.create).toHaveBeenCalledWith(
                Task,
                expect.objectContaining({
                    projectId,
                    columnId: dto.columnId,
                    creatorId: userId,
                    title: dto.title,
                    priority: dto.priority,
                    position: 3,
                }),
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.createTask(userId, projectId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when column does not belong to the project', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(null);

            await expect(
                service.createTask(userId, projectId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when column is at WIP limit', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(
                createMockColumn({ wipLimit: 3 }),
            );
            taskRepository.getTaskCountInColumn.mockResolvedValue(3);

            await expect(
                service.createTask(userId, projectId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should attach labels when labelIds are provided', async () => {
            const labels = [
                { id: 'label-1', name: 'Bug' },
                { id: 'label-2', name: 'Feature' },
            ];
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(createMockColumn());
            taskRepository.getMaxPositionInColumn.mockResolvedValue(-1);
            taskRepository.getTaskCountInColumn.mockResolvedValue(0);
            labelRepo.find.mockResolvedValue(labels);

            const savedTask = createMockTask({ labels: labels as any });
            const mockManager = {
                create: jest.fn().mockReturnValue(savedTask),
                save: jest.fn().mockResolvedValue(savedTask),
                findOne: jest.fn().mockResolvedValue(savedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const dtoWithLabels: CreateTaskDto = {
                ...dto,
                labelIds: ['label-1', 'label-2'],
            };

            await service.createTask(userId, projectId, dtoWithLabels);

            expect(labelRepo.find).toHaveBeenCalled();
            expect(mockManager.create).toHaveBeenCalledWith(
                Task,
                expect.objectContaining({ labels }),
            );
        });

        it('should set position to 0 when column has no tasks (maxPosition = -1)', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(createMockColumn());
            taskRepository.getMaxPositionInColumn.mockResolvedValue(-1);
            taskRepository.getTaskCountInColumn.mockResolvedValue(0);
            labelRepo.find.mockResolvedValue([]);

            const savedTask = createMockTask({ position: 0 });
            const mockManager = {
                create: jest.fn().mockReturnValue(savedTask),
                save: jest.fn().mockResolvedValue(savedTask),
                findOne: jest.fn().mockResolvedValue(savedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            await service.createTask(userId, projectId, dto);

            expect(mockManager.create).toHaveBeenCalledWith(
                Task,
                expect.objectContaining({ position: 0 }),
            );
        });

        it('should set assigneeId to null when not provided', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            columnRepo.findOne.mockResolvedValue(createMockColumn());
            taskRepository.getMaxPositionInColumn.mockResolvedValue(-1);
            taskRepository.getTaskCountInColumn.mockResolvedValue(0);
            labelRepo.find.mockResolvedValue([]);

            const savedTask = createMockTask();
            const mockManager = {
                create: jest.fn().mockReturnValue(savedTask),
                save: jest.fn().mockResolvedValue(savedTask),
                findOne: jest.fn().mockResolvedValue(savedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            await service.createTask(userId, projectId, {
                title: 'No Assignee',
                columnId: 'column-1',
            });

            expect(mockManager.create).toHaveBeenCalledWith(
                Task,
                expect.objectContaining({ assigneeId: null }),
            );
        });
    });

    // ─── getTaskById ─────────────────────────────────────────────────

    describe('getTaskById', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';

        it('should return the task with full relations when user is a member', async () => {
            const task = createMockTask({ id: taskId, projectId });
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findTaskWithDetails.mockResolvedValue(task);

            const result = await service.getTaskById(userId, projectId, taskId);

            expect(result).toEqual(task);
            expect(taskRepository.findTaskWithDetails).toHaveBeenCalledWith(
                taskId,
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getTaskById(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not exist', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findTaskWithDetails.mockResolvedValue(null);

            await expect(
                service.getTaskById(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findTaskWithDetails.mockResolvedValue(
                createMockTask({ id: taskId, projectId: 'other-project' }),
            );

            await expect(
                service.getTaskById(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── updateTask ──────────────────────────────────────────────────

    describe('updateTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';
        const dto: UpdateTaskDto = { title: 'Updated Title' } as UpdateTaskDto;

        it('should allow the project owner to update any task', async () => {
            const ownerMember = createMockMember({
                projectRole: ProjectRole.OWNER,
            });
            const task = createMockTask({
                id: taskId,
                projectId,
                creatorId: 'another-user',
                assigneeId: 'yet-another-user',
            });
            memberRepo.findOne.mockResolvedValue(ownerMember);
            taskRepository.findTaskWithDetails.mockResolvedValue(task);

            const updatedTask = createMockTask({ title: 'Updated Title' });
            const mockManager = {
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(updatedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const result = await service.updateTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(updatedTask);
        });

        it('should allow the task creator to update their own task', async () => {
            const memberUser = createMockMember({
                projectRole: ProjectRole.MEMBER,
            });
            const task = createMockTask({
                id: taskId,
                projectId,
                creatorId: userId,
            });
            memberRepo.findOne.mockResolvedValue(memberUser);
            taskRepository.findTaskWithDetails.mockResolvedValue(task);

            const updatedTask = createMockTask({ title: 'Updated Title' });
            const mockManager = {
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(updatedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const result = await service.updateTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(updatedTask);
        });

        it('should allow the task assignee to update the task', async () => {
            const memberUser = createMockMember({
                userId,
                projectRole: ProjectRole.MEMBER,
            });
            const task = createMockTask({
                id: taskId,
                projectId,
                creatorId: 'other-user',
                assigneeId: userId,
            });
            memberRepo.findOne.mockResolvedValue(memberUser);
            taskRepository.findTaskWithDetails.mockResolvedValue(task);

            const updatedTask = createMockTask({ title: 'Updated' });
            const mockManager = {
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(updatedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const result = await service.updateTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(updatedTask);
        });

        it('should throw ForbiddenException when member tries to update another user task', async () => {
            const memberUser = createMockMember({
                projectRole: ProjectRole.MEMBER,
            });
            const task = createMockTask({
                id: taskId,
                projectId,
                creatorId: 'other-user',
                assigneeId: 'yet-another-user',
            });
            memberRepo.findOne.mockResolvedValue(memberUser);
            taskRepository.findTaskWithDetails.mockResolvedValue(task);

            await expect(
                service.updateTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not exist', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findTaskWithDetails.mockResolvedValue(null);

            await expect(
                service.updateTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findTaskWithDetails.mockResolvedValue(
                createMockTask({ id: taskId, projectId: 'other-project' }),
            );

            await expect(
                service.updateTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should sync labels when labelIds is provided in dto', async () => {
            const ownerMember = createMockMember({
                projectRole: ProjectRole.OWNER,
            });
            const task = createMockTask({ id: taskId, projectId });
            memberRepo.findOne.mockResolvedValue(ownerMember);
            taskRepository.findTaskWithDetails.mockResolvedValue(task);
            labelRepo.find.mockResolvedValue([{ id: 'label-1', name: 'Bug' }]);

            const updatedTask = createMockTask();
            const mockManager = {
                update: jest.fn(),
                findOne: jest
                    .fn()
                    .mockResolvedValueOnce({ ...task, labels: [] })
                    .mockResolvedValueOnce(updatedTask),
                save: jest.fn(),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            await service.updateTask(userId, projectId, taskId, {
                labelIds: ['label-1'],
            } as UpdateTaskDto);

            expect(labelRepo.find).toHaveBeenCalled();
            expect(mockManager.save).toHaveBeenCalled();
        });
    });

    // ─── moveTask ────────────────────────────────────────────────────

    describe('moveTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';

        it('should move a task to a different column', async () => {
            const task = createMockTask({
                id: taskId,
                projectId,
                columnId: 'column-1',
                position: 0,
            });
            const targetColumn = createMockColumn({
                id: 'column-2',
                wipLimit: null,
            });

            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(task);
            columnRepo.findOne.mockResolvedValue(targetColumn);

            const movedTask = createMockTask({
                columnId: 'column-2',
                position: 1,
            });
            const mockQb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue(undefined),
            };
            const mockManager = {
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(movedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const dto: MoveTaskDto = { columnId: 'column-2', position: 1 };
            const result = await service.moveTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(movedTask);
        });

        it('should allow same-column reorder even when at WIP limit', async () => {
            const task = createMockTask({
                id: taskId,
                projectId,
                columnId: 'column-1',
                position: 0,
            });
            const column = createMockColumn({ id: 'column-1', wipLimit: 3 });

            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(task);
            columnRepo.findOne.mockResolvedValue(column);
            // WIP check should NOT be called for same-column moves

            const movedTask = createMockTask({ position: 2 });
            const mockQb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue(undefined),
            };
            const mockManager = {
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(movedTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const dto: MoveTaskDto = { columnId: 'column-1', position: 2 };
            const result = await service.moveTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            // Should succeed without WIP check
            expect(result).toEqual(movedTask);
            expect(taskRepository.getTaskCountInColumn).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when target column is at WIP limit', async () => {
            const task = createMockTask({
                id: taskId,
                projectId,
                columnId: 'column-1',
                position: 0,
            });
            const targetColumn = createMockColumn({
                id: 'column-2',
                wipLimit: 3,
                title: 'In Progress',
            });

            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(task);
            columnRepo.findOne.mockResolvedValue(targetColumn);
            taskRepository.getTaskCountInColumn.mockResolvedValue(3);

            const dto: MoveTaskDto = { columnId: 'column-2', position: 0 };

            await expect(
                service.moveTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            const dto: MoveTaskDto = { columnId: 'column-2', position: 0 };

            await expect(
                service.moveTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not exist', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(null);

            const dto: MoveTaskDto = { columnId: 'column-2', position: 0 };

            await expect(
                service.moveTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when target column does not belong to the project', async () => {
            const task = createMockTask({ id: taskId, projectId });
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(task);
            columnRepo.findOne.mockResolvedValue(null);

            const dto: MoveTaskDto = {
                columnId: 'invalid-column',
                position: 0,
            };

            await expect(
                service.moveTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(createMockMember());
            taskRepository.findById.mockResolvedValue(
                createMockTask({ projectId: 'other-project' }),
            );

            const dto: MoveTaskDto = { columnId: 'column-2', position: 0 };

            await expect(
                service.moveTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── deleteTask ──────────────────────────────────────────────────

    describe('deleteTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';

        it('should soft-delete the task when user is the project owner', async () => {
            const ownerMember = createMockMember({
                projectRole: ProjectRole.OWNER,
            });
            const task = createMockTask({
                id: taskId,
                projectId,
                columnId: 'column-1',
                position: 2,
            });
            memberRepo.findOne.mockResolvedValue(ownerMember);
            taskRepository.findById.mockResolvedValue(task);
            taskRepository.shiftPositionsUp.mockResolvedValue(undefined);

            const mockManager = {
                update: jest.fn(),
                softDelete: jest.fn(),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            await service.deleteTask(userId, projectId, taskId);

            expect(mockManager.update).toHaveBeenCalledWith(Task, taskId, {
                deletedById: userId,
            });
            expect(mockManager.softDelete).toHaveBeenCalledWith(Task, taskId);
            expect(taskRepository.shiftPositionsUp).toHaveBeenCalledWith(
                'column-1',
                2,
            );
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.MEMBER }),
            );

            await expect(
                service.deleteTask(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.deleteTask(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not exist', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findById.mockResolvedValue(null);

            await expect(
                service.deleteTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findById.mockResolvedValue(
                createMockTask({ projectId: 'other-project' }),
            );

            await expect(
                service.deleteTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── getTrashedTasks ─────────────────────────────────────────────

    describe('getTrashedTasks', () => {
        const userId = 'user-1';
        const projectId = 'project-1';

        it('should return soft-deleted tasks when user is the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            const trashedTasks = [
                createMockTask({ deletedAt: new Date() as any }),
            ];
            taskRepository.findTrashedByProject.mockResolvedValue(trashedTasks);

            const result = await service.getTrashedTasks(userId, projectId);

            expect(result).toEqual(trashedTasks);
            expect(taskRepository.findTrashedByProject).toHaveBeenCalledWith(
                projectId,
            );
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.MEMBER }),
            );

            await expect(
                service.getTrashedTasks(userId, projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── restoreTask ─────────────────────────────────────────────────

    describe('restoreTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';

        it('should restore a soft-deleted task to the end of its column', async () => {
            const trashedTask = createMockTask({
                id: taskId,
                projectId,
                columnId: 'column-1',
                deletedAt: new Date() as any,
            });
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(trashedTask);
            taskRepository.getMaxPositionInColumn.mockResolvedValue(4);

            const restoredTask = createMockTask({
                id: taskId,
                position: 5,
                deletedAt: undefined,
            });
            const mockManager = {
                restore: jest.fn(),
                update: jest.fn(),
                findOne: jest.fn().mockResolvedValue(restoredTask),
            };
            dataSource.transaction.mockImplementation(async (cb: any) =>
                cb(mockManager),
            );

            const result = await service.restoreTask(userId, projectId, taskId);

            expect(result).toEqual(restoredTask);
            expect(mockManager.restore).toHaveBeenCalledWith(Task, taskId);
            expect(mockManager.update).toHaveBeenCalledWith(Task, taskId, {
                deletedById: null,
                position: 5,
            });
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.MEMBER }),
            );

            await expect(
                service.restoreTask(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task is not in trash', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(null);

            await expect(
                service.restoreTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when trashed task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(
                createMockTask({ id: taskId, projectId: 'other-project' }),
            );

            await expect(
                service.restoreTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── permanentDeleteTask ─────────────────────────────────────────

    describe('permanentDeleteTask', () => {
        const userId = 'user-1';
        const projectId = 'project-1';
        const taskId = 'task-1';

        it('should permanently delete a trashed task when user is the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(
                createMockTask({ id: taskId, projectId }),
            );
            taskRepository.permanentDelete.mockResolvedValue(undefined);

            await service.permanentDeleteTask(userId, projectId, taskId);

            expect(taskRepository.permanentDelete).toHaveBeenCalledWith(taskId);
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.MEMBER }),
            );

            await expect(
                service.permanentDeleteTask(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task is not in trash', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(null);

            await expect(
                service.permanentDeleteTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when trashed task belongs to a different project', async () => {
            memberRepo.findOne.mockResolvedValue(
                createMockMember({ projectRole: ProjectRole.OWNER }),
            );
            taskRepository.findTrashedById.mockResolvedValue(
                createMockTask({ projectId: 'other-project' }),
            );

            await expect(
                service.permanentDeleteTask(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── getMyTasks ──────────────────────────────────────────────────

    describe('getMyTasks', () => {
        it('should return all tasks assigned to the user across projects', async () => {
            const tasks = [
                createMockTask({
                    assigneeId: 'user-1',
                    projectId: 'project-1',
                }),
                createMockTask({
                    assigneeId: 'user-1',
                    projectId: 'project-2',
                }),
            ];
            taskRepository.findTasksByAssignee.mockResolvedValue(tasks);

            const result = await service.getMyTasks('user-1');

            expect(result).toEqual(tasks);
            expect(taskRepository.findTasksByAssignee).toHaveBeenCalledWith(
                'user-1',
            );
        });

        it('should return an empty array when the user has no assigned tasks', async () => {
            taskRepository.findTasksByAssignee.mockResolvedValue([]);

            const result = await service.getMyTasks('user-1');

            expect(result).toEqual([]);
        });
    });
});
