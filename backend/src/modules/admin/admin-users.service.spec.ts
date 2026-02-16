import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnprocessableEntityException,
    BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AdminUsersService } from './admin-users.service';
import { User } from '@modules/users/user.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Task } from '@modules/tasks/task.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { PasswordResetToken } from '@modules/auth/entities/password-reset-token.entity';
import { Project } from '@modules/projects/project.entity';
import { UserRole, UserStatus, ProjectStatus } from '@shared/enums';
import { BulkAction } from './dtos';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a fake query-builder chain where every method returns `this`. */
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
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    return qb;
}

function mockRepository() {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((data) => data),
        save: jest
            .fn()
            .mockImplementation((entity) =>
                Promise.resolve({ ...entity, id: entity.id ?? 'new-id' }),
            ),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        softRemove: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AdminUsersService', () => {
    let service: AdminUsersService;
    let userRepo: ReturnType<typeof mockRepository>;
    let memberRepo: ReturnType<typeof mockRepository>;
    let taskRepo: ReturnType<typeof mockRepository>;
    let refreshTokenRepo: ReturnType<typeof mockRepository>;
    let timeEntryRepo: ReturnType<typeof mockRepository>;
    let passwordResetTokenRepo: ReturnType<typeof mockRepository>;
    let projectRepo: ReturnType<typeof mockRepository>;
    let dataSource: { transaction: jest.Mock };

    beforeEach(async () => {
        userRepo = mockRepository();
        memberRepo = mockRepository();
        taskRepo = mockRepository();
        refreshTokenRepo = mockRepository();
        timeEntryRepo = mockRepository();
        passwordResetTokenRepo = mockRepository();
        projectRepo = mockRepository();
        dataSource = {
            transaction: jest.fn().mockImplementation(async (cb) => {
                const manager = {
                    delete: jest.fn().mockResolvedValue({ affected: 1 }),
                    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                };
                return cb(manager);
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminUsersService,
                { provide: getRepositoryToken(User), useValue: userRepo },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepo,
                },
                { provide: getRepositoryToken(Task), useValue: taskRepo },
                {
                    provide: getRepositoryToken(RefreshToken),
                    useValue: refreshTokenRepo,
                },
                {
                    provide: getRepositoryToken(TimeEntry),
                    useValue: timeEntryRepo,
                },
                {
                    provide: getRepositoryToken(PasswordResetToken),
                    useValue: passwordResetTokenRepo,
                },
                { provide: getRepositoryToken(Project), useValue: projectRepo },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<AdminUsersService>(AdminUsersService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // listUsers
    // ═══════════════════════════════════════════════════════════════════════

    describe('listUsers', () => {
        it('should return paginated users with default pagination', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
                createdAt: new Date(),
                lastActiveAt: null,
                deletedAt: null,
            };

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [mockUser],
                    raw: [{ projectsCount: '3', tasksCount: '5' }],
                }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.listUsers({});

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.total).toBe(1);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].projectsCount).toBe(3);
            expect(result.data[0].tasksCount).toBe(5);
        });

        it('should apply search filter on fullName and email', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await service.listUsers({ search: 'john' });

            expect(qb.andWhere).toHaveBeenCalled();
        });

        it('should apply role filter', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await service.listUsers({ role: UserRole.ADMIN });

            expect(qb.andWhere).toHaveBeenCalledWith('user.role = :role', {
                role: UserRole.ADMIN,
            });
        });

        it('should apply status filter for DELETED users using withDeleted', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await service.listUsers({ status: UserStatus.DELETED });

            expect(qb.withDeleted).toHaveBeenCalled();
            expect(qb.andWhere).toHaveBeenCalledWith(
                'user.deletedAt IS NOT NULL',
            );
        });

        it('should apply non-DELETED status filter directly', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await service.listUsers({ status: UserStatus.ACTIVE });

            expect(qb.andWhere).toHaveBeenCalledWith('user.status = :status', {
                status: UserStatus.ACTIVE,
            });
        });

        it('should apply pagination with custom page and limit', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(25),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.listUsers({ page: 3, limit: 5 });

            expect(result.page).toBe(3);
            expect(result.limit).toBe(5);
            expect(qb.offset).toHaveBeenCalledWith(10); // (3-1)*5
            expect(qb.limit).toHaveBeenCalledWith(5);
        });

        it('should sort by the provided sortBy field', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(0),
                getRawAndEntities: jest
                    .fn()
                    .mockResolvedValue({ entities: [], raw: [] }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await service.listUsers({ sortBy: 'email', sortOrder: 'ASC' });

            expect(qb.orderBy).toHaveBeenCalledWith('user.email', 'ASC');
        });

        it('should show deleted status for users with deletedAt', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'Deleted User',
                email: 'del@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
                createdAt: new Date(),
                lastActiveAt: null,
                deletedAt: new Date(),
            };

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [mockUser],
                    raw: [{ projectsCount: '0', tasksCount: '0' }],
                }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.listUsers({
                status: UserStatus.DELETED,
            });

            expect(result.data[0].status).toBe(UserStatus.DELETED);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // createUser
    // ═══════════════════════════════════════════════════════════════════════

    describe('createUser', () => {
        it('should create a user successfully', async () => {
            userRepo.findOne.mockResolvedValue(null);
            const savedUser = {
                id: 'new-id',
                fullName: 'New User',
                email: 'new@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
                createdAt: new Date(),
            };
            userRepo.save.mockResolvedValue(savedUser);

            const result = await service.createUser({
                name: 'New User',
                email: 'New@test.com',
                role: UserRole.TEAM_MEMBER,
            });

            expect(result.id).toBe('new-id');
            expect(result.email).toBe('new@test.com');
            expect(result.role).toBe(UserRole.TEAM_MEMBER);
        });

        it('should throw ConflictException if email already exists', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'existing',
                email: 'dup@test.com',
            });

            await expect(
                service.createUser({
                    name: 'Dup',
                    email: 'dup@test.com',
                    role: UserRole.TEAM_MEMBER,
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should lowercase the email before saving', async () => {
            userRepo.findOne.mockResolvedValue(null);
            userRepo.save.mockImplementation((entity) =>
                Promise.resolve({ ...entity, id: 'id' }),
            );

            await service.createUser({
                name: 'User',
                email: 'UPPER@TEST.COM',
                role: UserRole.TEAM_MEMBER,
            });

            expect(userRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { email: 'upper@test.com' },
                }),
            );
        });

        it('should generate a random hashed password for the new user', async () => {
            userRepo.findOne.mockResolvedValue(null);
            userRepo.save.mockImplementation((entity) =>
                Promise.resolve({ ...entity, id: 'id', createdAt: new Date() }),
            );

            await service.createUser({
                name: 'User',
                email: 'user@test.com',
                role: UserRole.TEAM_MEMBER,
            });

            // The create call should include a password field
            expect(userRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    password: expect.any(String),
                }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getUserDetail
    // ═══════════════════════════════════════════════════════════════════════

    describe('getUserDetail', () => {
        it('should return user detail with projects, recentTasks, and stats', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'Detail User',
                email: 'detail@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
                jobTitle: 'Developer',
                emailVerified: true,
                lastActiveAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            userRepo.findOne.mockResolvedValue(mockUser);

            const memberQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        project: {
                            id: 'p1',
                            title: 'Project 1',
                            status: ProjectStatus.ACTIVE,
                        },
                        projectRole: 'OWNER',
                    },
                ]),
            });
            memberRepo.createQueryBuilder.mockReturnValue(memberQb);

            const taskQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: 't1',
                        title: 'Task 1',
                        project: { title: 'Project 1' },
                        column: { title: 'In Progress' },
                        priority: 'HIGH',
                        dueDate: null,
                        createdAt: new Date(),
                    },
                ]),
                getCount: jest.fn().mockResolvedValue(5),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            memberRepo.count.mockResolvedValue(2);

            const timeQb = createMockQueryBuilder({
                getRawOne: jest.fn().mockResolvedValue({ total: '120' }),
            });
            timeEntryRepo.createQueryBuilder.mockReturnValue(timeQb);

            const result = await service.getUserDetail('u1');

            expect(result.id).toBe('u1');
            expect(result.projects).toHaveLength(1);
            expect(result.recentTasks).toHaveLength(1);
            expect(result.stats.projectsCount).toBe(2);
            expect(result.stats.totalTimeLoggedMinutes).toBe(120);
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.getUserDetail('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should show DELETED status if user has deletedAt', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'Deleted',
                email: 'del@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                deletedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            userRepo.findOne.mockResolvedValue(mockUser);

            const memberQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            memberRepo.createQueryBuilder.mockReturnValue(memberQb);
            memberRepo.count.mockResolvedValue(0);

            const taskQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
                getCount: jest.fn().mockResolvedValue(0),
            });
            taskRepo.createQueryBuilder.mockReturnValue(taskQb);

            const timeQb = createMockQueryBuilder({
                getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            });
            timeEntryRepo.createQueryBuilder.mockReturnValue(timeQb);

            const result = await service.getUserDetail('u1');

            expect(result.status).toBe(UserStatus.DELETED);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateUser
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateUser', () => {
        it('should update allowed fields (name, jobTitle, avatarUrl)', async () => {
            const existingUser = {
                id: 'u1',
                fullName: 'Old Name',
                email: 'user@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
                jobTitle: null,
            };
            userRepo.findOne.mockResolvedValue(existingUser);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.updateUser('u1', {
                name: 'New Name',
                jobTitle: 'Senior Dev',
                avatarUrl: 'https://img.com/avatar.png',
            });

            expect(result.name).toBe('New Name');
            expect(result.jobTitle).toBe('Senior Dev');
            expect(result.avatarUrl).toBe('https://img.com/avatar.png');
        });

        it('should throw NotFoundException if user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.updateUser('missing', { name: 'X' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should only update provided fields', async () => {
            const existingUser = {
                id: 'u1',
                fullName: 'Keep Name',
                email: 'keep@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: 'old-url',
                jobTitle: 'Old Title',
            };
            userRepo.findOne.mockResolvedValue(existingUser);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.updateUser('u1', {
                jobTitle: 'New Title',
            });

            expect(result.name).toBe('Keep Name');
            expect(result.jobTitle).toBe('New Title');
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // changeStatus
    // ═══════════════════════════════════════════════════════════════════════

    describe('changeStatus', () => {
        it('should suspend a user and delete refresh tokens', async () => {
            const user = {
                id: 'u2',
                fullName: 'Target',
                email: 'target@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                deletedAt: null,
            };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.changeStatus('admin-id', 'u2', {
                status: UserStatus.SUSPENDED,
            });

            expect(result.status).toBe(UserStatus.SUSPENDED);
            expect(refreshTokenRepo.delete).toHaveBeenCalledWith({
                userId: 'u2',
            });
        });

        it('should activate a user', async () => {
            const user = {
                id: 'u2',
                fullName: 'Suspended User',
                email: 'sus@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.SUSPENDED,
                deletedAt: null,
            };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.changeStatus('admin-id', 'u2', {
                status: UserStatus.ACTIVE,
            });

            expect(result.status).toBe(UserStatus.ACTIVE);
            expect(refreshTokenRepo.delete).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when changing own status', async () => {
            await expect(
                service.changeStatus('admin-id', 'admin-id', {
                    status: UserStatus.SUSPENDED,
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw UnprocessableEntityException for deleted user', async () => {
            const deletedUser = {
                id: 'u3',
                fullName: 'Deleted',
                email: 'del@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.DELETED,
                deletedAt: new Date(),
            };
            userRepo.findOne.mockResolvedValue(deletedUser);

            await expect(
                service.changeStatus('admin-id', 'u3', {
                    status: UserStatus.ACTIVE,
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw NotFoundException for missing user', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.changeStatus('admin-id', 'missing', {
                    status: UserStatus.ACTIVE,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // changeRole
    // ═══════════════════════════════════════════════════════════════════════

    describe('changeRole', () => {
        it('should change a non-admin user role to project_owner', async () => {
            const user = {
                id: 'u2',
                fullName: 'Member',
                email: 'member@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
            };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.changeRole('admin-id', 'u2', {
                role: UserRole.PROJECT_OWNER,
            });

            expect(result.role).toBe(UserRole.PROJECT_OWNER);
        });

        it('should throw ForbiddenException when trying to change an admin role', async () => {
            const adminUser = {
                id: 'u3',
                fullName: 'Admin',
                email: 'admin@test.com',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
            };
            userRepo.findOne.mockResolvedValue(adminUser);

            await expect(
                service.changeRole('admin-id', 'u3', {
                    role: UserRole.PROJECT_OWNER,
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when trying to promote to admin', async () => {
            const user = {
                id: 'u2',
                fullName: 'Member',
                email: 'member@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
            };
            userRepo.findOne.mockResolvedValue(user);

            await expect(
                service.changeRole('admin-id', 'u2', {
                    role: UserRole.ADMIN as any,
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if user not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.changeRole('admin-id', 'missing', {
                    role: UserRole.PROJECT_OWNER,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // resetPassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('resetPassword', () => {
        it('should create a password reset token successfully', async () => {
            const user = {
                id: 'u1',
                fullName: 'User',
                email: 'user@test.com',
                deletedAt: null,
            };
            userRepo.findOne.mockResolvedValue(user);

            const resetQb = createMockQueryBuilder({
                execute: jest.fn().mockResolvedValue(undefined),
            });
            passwordResetTokenRepo.createQueryBuilder.mockReturnValue(resetQb);
            passwordResetTokenRepo.save.mockResolvedValue({});

            const result = await service.resetPassword('u1');

            expect(result.message).toContain('Password reset initiated');
            expect(passwordResetTokenRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1',
                    isUsed: false,
                }),
            );
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.resetPassword('missing')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw UnprocessableEntityException for deleted user', async () => {
            const deletedUser = { id: 'u1', deletedAt: new Date() };
            userRepo.findOne.mockResolvedValue(deletedUser);

            await expect(service.resetPassword('u1')).rejects.toThrow(
                UnprocessableEntityException,
            );
        });

        it('should mark existing reset tokens as used before creating a new one', async () => {
            const user = { id: 'u1', fullName: 'User', deletedAt: null };
            userRepo.findOne.mockResolvedValue(user);

            const executeMock = jest.fn().mockResolvedValue(undefined);
            const resetQb = createMockQueryBuilder({ execute: executeMock });
            passwordResetTokenRepo.createQueryBuilder.mockReturnValue(resetQb);
            passwordResetTokenRepo.save.mockResolvedValue({});

            await service.resetPassword('u1');

            expect(executeMock).toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // deleteUser
    // ═══════════════════════════════════════════════════════════════════════

    describe('deleteUser', () => {
        it('should throw ForbiddenException when deleting self', async () => {
            await expect(
                service.deleteUser('admin-id', 'admin-id'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when user not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.deleteUser('admin-id', 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when deleting another admin', async () => {
            const adminUser = {
                id: 'other-admin',
                role: UserRole.ADMIN,
            };
            userRepo.findOne.mockResolvedValue(adminUser);

            await expect(
                service.deleteUser('admin-id', 'other-admin'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw UnprocessableEntityException if user owns projects with members', async () => {
            const user = { id: 'u2', role: UserRole.PROJECT_OWNER };
            userRepo.findOne.mockResolvedValue(user);

            const projQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: 'p1',
                        title: 'Active Project',
                        status: ProjectStatus.ACTIVE,
                    },
                ]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(projQb);
            memberRepo.count.mockResolvedValue(3); // more than 1 member

            await expect(service.deleteUser('admin-id', 'u2')).rejects.toThrow(
                UnprocessableEntityException,
            );
        });

        it('should auto-archive sole-owner projects and soft-delete the user', async () => {
            const user = { id: 'u2', role: UserRole.TEAM_MEMBER };
            userRepo.findOne.mockResolvedValue(user);

            const projQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: 'p1',
                        title: 'Solo Project',
                        status: ProjectStatus.ACTIVE,
                    },
                ]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(projQb);
            memberRepo.count.mockResolvedValue(1); // sole owner

            await service.deleteUser('admin-id', 'u2');

            expect(projectRepo.update).toHaveBeenCalledWith('p1', {
                status: ProjectStatus.ARCHIVED,
            });
            expect(dataSource.transaction).toHaveBeenCalled();
        });

        it('should succeed if user owns no active projects', async () => {
            const user = { id: 'u2', role: UserRole.TEAM_MEMBER };
            userRepo.findOne.mockResolvedValue(user);

            const projQb = createMockQueryBuilder({
                getMany: jest.fn().mockResolvedValue([]),
            });
            projectRepo.createQueryBuilder.mockReturnValue(projQb);

            await expect(
                service.deleteUser('admin-id', 'u2'),
            ).resolves.toBeUndefined();
            expect(dataSource.transaction).toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // bulkAction
    // ═══════════════════════════════════════════════════════════════════════

    describe('bulkAction', () => {
        it('should process each user independently and return counts', async () => {
            // First user succeeds, second fails
            const user1 = {
                id: 'u1',
                fullName: 'User1',
                email: 'u1@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                deletedAt: null,
            };
            userRepo.findOne
                .mockResolvedValueOnce(user1) // changeStatus for u1
                .mockResolvedValueOnce(null); // changeStatus for u2 (not found)

            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.bulkAction('admin-id', {
                userIds: ['u1', 'u2'],
                action: BulkAction.SUSPEND,
            });

            expect(result.success).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].userId).toBe('u2');
        });

        it('should handle ACTIVATE bulk action', async () => {
            const user = {
                id: 'u1',
                fullName: 'User',
                email: 'u@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.SUSPENDED,
                deletedAt: null,
            };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockImplementation((u) =>
                Promise.resolve({ ...u, updatedAt: new Date() }),
            );

            const result = await service.bulkAction('admin-id', {
                userIds: ['u1'],
                action: BulkAction.ACTIVATE,
            });

            expect(result.success).toBe(1);
            expect(result.failed).toBe(0);
        });

        it('should handle DELETE bulk action and count failures for self-delete', async () => {
            const result = await service.bulkAction('admin-id', {
                userIds: ['admin-id'],
                action: BulkAction.DELETE,
            });

            expect(result.success).toBe(0);
            expect(result.failed).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // exportUsersCsv
    // ═══════════════════════════════════════════════════════════════════════

    describe('exportUsersCsv', () => {
        it('should generate CSV with correct header and rows', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'John Doe',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                jobTitle: 'Developer',
                createdAt: new Date('2024-06-15'),
                lastActiveAt: new Date('2024-06-20'),
                deletedAt: null,
            };

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [mockUser],
                    raw: [{ projectsCount: '2', tasksCount: '10' }],
                }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const csv = await service.exportUsersCsv({});

            const lines = csv.split('\n');
            expect(lines[0]).toBe(
                'Name,Email,Role,Status,Job Title,Projects Count,Tasks Count,Registration Date,Last Active',
            );
            expect(lines).toHaveLength(2); // header + 1 row
            expect(lines[1]).toContain('John Doe');
            expect(lines[1]).toContain('john@test.com');
            expect(lines[1]).toContain('TEAM_MEMBER');
        });

        it('should throw UnprocessableEntityException if total exceeds 10000', async () => {
            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(10001),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.exportUsersCsv({})).rejects.toThrow(
                UnprocessableEntityException,
            );
        });

        it('should escape CSV fields containing commas', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'Doe, John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                jobTitle: null,
                createdAt: new Date('2024-01-01'),
                lastActiveAt: null,
                deletedAt: null,
            };

            const qb = createMockQueryBuilder({
                getCount: jest.fn().mockResolvedValue(1),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [mockUser],
                    raw: [{ projectsCount: '0', tasksCount: '0' }],
                }),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const csv = await service.exportUsersCsv({});
            const dataLine = csv.split('\n')[1];

            expect(dataLine).toContain('"Doe, John"');
        });
    });
});
