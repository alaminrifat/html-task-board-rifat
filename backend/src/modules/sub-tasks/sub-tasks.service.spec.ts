import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubTasksService } from './sub-tasks.service';
import { SubTaskRepository } from './sub-task.repository';
import { SubTask } from './sub-task.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTasksDto } from './dtos';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const createMockSubTask = (overrides: Partial<SubTask> = {}): SubTask =>
    ({
        id: 'subtask-1',
        taskId: 'task-1',
        title: 'Test SubTask',
        isCompleted: false,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as unknown as SubTask;

const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
        id: 'task-1',
        projectId: 'project-1',
        columnId: 'column-1',
        ...overrides,
    }) as unknown as Task;

const createMockMembership = (): ProjectMember =>
    ({
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
    }) as unknown as ProjectMember;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('SubTasksService', () => {
    let service: SubTasksService;
    let subTaskRepository: Record<string, jest.Mock>;
    let taskRepo: { findOne: jest.Mock };
    let projectMemberRepo: { findOne: jest.Mock };
    let dataSource: { createQueryRunner: jest.Mock };

    beforeEach(async () => {
        subTaskRepository = {
            findByTask: jest.fn(),
            getMaxPosition: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
        };

        taskRepo = { findOne: jest.fn() };
        projectMemberRepo = { findOne: jest.fn() };

        dataSource = {
            createQueryRunner: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubTasksService,
                { provide: SubTaskRepository, useValue: subTaskRepository },
                { provide: getRepositoryToken(Task), useValue: taskRepo },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: projectMemberRepo,
                },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SubTasksService>(SubTasksService);
    });

    const userId = 'user-1';
    const projectId = 'project-1';
    const taskId = 'task-1';

    // ─── getSubTasks ─────────────────────────────────────────────────

    describe('getSubTasks', () => {
        it('should return subtasks ordered by position', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());

            const subtasks = [
                createMockSubTask({ position: 0 }),
                createMockSubTask({ id: 'subtask-2', position: 1 }),
            ];
            subTaskRepository.findByTask.mockResolvedValue(subtasks);

            const result = await service.getSubTasks(userId, projectId, taskId);

            expect(result).toEqual(subtasks);
            expect(subTaskRepository.findByTask).toHaveBeenCalledWith(taskId);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            projectMemberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getSubTasks(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not belong to the project', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getSubTasks(userId, projectId, taskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── createSubTask ───────────────────────────────────────────────

    describe('createSubTask', () => {
        const dto: CreateSubTaskDto = { title: 'New SubTask' };

        it('should create a subtask with the correct position', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.getMaxPosition.mockResolvedValue(2);

            const created = createMockSubTask({
                title: 'New SubTask',
                position: 3,
            });
            subTaskRepository.create.mockResolvedValue(created);

            const result = await service.createSubTask(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(created);
            expect(subTaskRepository.create).toHaveBeenCalledWith({
                taskId,
                title: 'New SubTask',
                isCompleted: false,
                position: 3,
            });
        });

        it('should set position to 0 when task has no subtasks (maxPosition = -1)', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.getMaxPosition.mockResolvedValue(-1);

            const created = createMockSubTask({ position: 0 });
            subTaskRepository.create.mockResolvedValue(created);

            await service.createSubTask(userId, projectId, taskId, dto);

            expect(subTaskRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ position: 0 }),
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            projectMemberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.createSubTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not belong to the project', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(null);

            await expect(
                service.createSubTask(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── updateSubTask ───────────────────────────────────────────────

    describe('updateSubTask', () => {
        const subTaskId = 'subtask-1';

        it('should update the title of a subtask', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(createMockSubTask());

            const updated = createMockSubTask({ title: 'Updated Title' });
            subTaskRepository.update.mockResolvedValue(updated);

            const dto: UpdateSubTaskDto = { title: 'Updated Title' };
            const result = await service.updateSubTask(
                userId,
                projectId,
                taskId,
                subTaskId,
                dto,
            );

            expect(result).toEqual(updated);
            expect(subTaskRepository.update).toHaveBeenCalledWith(
                subTaskId,
                expect.objectContaining({ title: 'Updated Title' }),
            );
        });

        it('should toggle isCompleted on a subtask', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(createMockSubTask());

            const updated = createMockSubTask({ isCompleted: true });
            subTaskRepository.update.mockResolvedValue(updated);

            const dto: UpdateSubTaskDto = { isCompleted: true };
            const result = await service.updateSubTask(
                userId,
                projectId,
                taskId,
                subTaskId,
                dto,
            );

            expect(result).toEqual(updated);
            expect(subTaskRepository.update).toHaveBeenCalledWith(
                subTaskId,
                expect.objectContaining({ isCompleted: true }),
            );
        });

        it('should throw NotFoundException when update returns null', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(createMockSubTask());
            subTaskRepository.update.mockResolvedValue(null);

            const dto: UpdateSubTaskDto = { title: 'Updated' };

            await expect(
                service.updateSubTask(
                    userId,
                    projectId,
                    taskId,
                    subTaskId,
                    dto,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            projectMemberRepo.findOne.mockResolvedValue(null);

            const dto: UpdateSubTaskDto = { title: 'Updated' };

            await expect(
                service.updateSubTask(
                    userId,
                    projectId,
                    taskId,
                    subTaskId,
                    dto,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when subtask does not belong to the task', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(null);

            const dto: UpdateSubTaskDto = { title: 'Updated' };

            await expect(
                service.updateSubTask(
                    userId,
                    projectId,
                    taskId,
                    subTaskId,
                    dto,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── deleteSubTask ───────────────────────────────────────────────

    describe('deleteSubTask', () => {
        const subTaskId = 'subtask-1';

        it('should soft-delete the subtask', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(createMockSubTask());
            subTaskRepository.softDelete.mockResolvedValue(true);

            await service.deleteSubTask(userId, projectId, taskId, subTaskId);

            expect(subTaskRepository.softDelete).toHaveBeenCalledWith(
                subTaskId,
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            projectMemberRepo.findOne.mockResolvedValue(null);

            await expect(
                service.deleteSubTask(userId, projectId, taskId, subTaskId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when subtask does not belong to the task', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());
            subTaskRepository.findOne.mockResolvedValue(null);

            await expect(
                service.deleteSubTask(userId, projectId, taskId, subTaskId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── reorderSubTasks ─────────────────────────────────────────────

    describe('reorderSubTasks', () => {
        it('should batch update positions in a transaction', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());

            const mockManager = {
                update: jest.fn(),
            };
            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: mockManager,
            };
            dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

            const reordered = [
                createMockSubTask({ id: 'subtask-1', position: 1 }),
                createMockSubTask({ id: 'subtask-2', position: 0 }),
            ];
            subTaskRepository.findByTask.mockResolvedValue(reordered);

            const dto: ReorderSubTasksDto = {
                subTasks: [
                    { id: 'subtask-1', position: 1 },
                    { id: 'subtask-2', position: 0 },
                ],
            };

            const result = await service.reorderSubTasks(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toEqual(reordered);
            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockManager.update).toHaveBeenCalledTimes(2);
            expect(mockManager.update).toHaveBeenCalledWith(
                SubTask,
                'subtask-1',
                { position: 1 },
            );
            expect(mockManager.update).toHaveBeenCalledWith(
                SubTask,
                'subtask-2',
                { position: 0 },
            );
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(createMockTask());

            const mockManager = {
                update: jest.fn().mockRejectedValue(new Error('DB error')),
            };
            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: mockManager,
            };
            dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

            const dto: ReorderSubTasksDto = {
                subTasks: [{ id: 'subtask-1', position: 0 }],
            };

            await expect(
                service.reorderSubTasks(userId, projectId, taskId, dto),
            ).rejects.toThrow('DB error');

            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            projectMemberRepo.findOne.mockResolvedValue(null);

            const dto: ReorderSubTasksDto = {
                subTasks: [{ id: 'subtask-1', position: 0 }],
            };

            await expect(
                service.reorderSubTasks(userId, projectId, taskId, dto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not belong to the project', async () => {
            projectMemberRepo.findOne.mockResolvedValue(createMockMembership());
            taskRepo.findOne.mockResolvedValue(null);

            const dto: ReorderSubTasksDto = {
                subTasks: [{ id: 'subtask-1', position: 0 }],
            };

            await expect(
                service.reorderSubTasks(userId, projectId, taskId, dto),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
