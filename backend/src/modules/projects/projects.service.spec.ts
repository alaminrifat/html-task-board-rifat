import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { ProjectsService } from './projects.service';
import { ProjectRepository } from './project.repository';
import { Project } from './project.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { BoardTemplate, ProjectRole, ProjectStatus } from '@shared/enums';

describe('ProjectsService', () => {
    let service: ProjectsService;
    let projectRepository: jest.Mocked<Partial<ProjectRepository>>;
    let memberRepo: jest.Mocked<Partial<Repository<ProjectMember>>>;
    let columnRepo: jest.Mocked<Partial<Repository<BoardColumn>>>;
    let dataSource: jest.Mocked<Partial<DataSource>>;
    let i18nHelper: { t: jest.Mock };

    const userId = 'user-uuid-1';
    const projectId = 'project-uuid-1';

    const mockProject: Partial<Project> = {
        id: projectId,
        title: 'Test Project',
        description: 'Test Description',
        ownerId: userId,
        status: ProjectStatus.ACTIVE,
        template: BoardTemplate.DEFAULT,
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockOwnerMember: Partial<ProjectMember> = {
        id: 'member-uuid-1',
        projectId,
        userId,
        projectRole: ProjectRole.OWNER,
    };

    const mockRegularMember: Partial<ProjectMember> = {
        id: 'member-uuid-2',
        projectId,
        userId: 'user-uuid-2',
        projectRole: ProjectRole.MEMBER,
    };

    beforeEach(async () => {
        projectRepository = {
            findById: jest.fn(),
            findProjectsForUser: jest.fn(),
            findProjectWithBoard: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
        };

        memberRepo = {
            findOne: jest.fn(),
        };

        columnRepo = {
            create: jest.fn(),
            save: jest.fn(),
        };

        const mockManager = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
        };

        dataSource = {
            transaction: jest.fn().mockImplementation(async (cb) => {
                return cb(mockManager);
            }),
        };

        i18nHelper = {
            t: jest.fn().mockReturnValue(''),
        };

        service = new ProjectsService(
            projectRepository as any,
            memberRepo as any,
            columnRepo as any,
            dataSource as any,
            i18nHelper as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── createProject ──────────────────────────────────────────────

    describe('createProject', () => {
        it('should create a project with DEFAULT template columns', async () => {
            const dto = { title: 'New Project', description: 'Desc' };
            const savedProject = { ...mockProject, id: 'new-id' };
            const mockManager = {
                create: jest.fn().mockReturnValue(savedProject),
                save: jest.fn().mockResolvedValue(savedProject),
                findOne: jest.fn().mockResolvedValue({
                    ...savedProject,
                    columns: [],
                    members: [],
                    owner: {},
                }),
            };

            (dataSource.transaction as jest.Mock).mockImplementation(
                async (cb) => cb(mockManager),
            );

            const result = await service.createProject(userId, dto);

            expect(dataSource.transaction).toHaveBeenCalled();
            // create called for project, 4 columns, and 1 member = multiple calls
            expect(mockManager.create).toHaveBeenCalled();
            expect(mockManager.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should create a project with MINIMAL template (2 columns)', async () => {
            const dto = {
                title: 'Minimal Project',
                template: BoardTemplate.MINIMAL,
            };
            const savedProject = {
                ...mockProject,
                id: 'min-id',
                template: BoardTemplate.MINIMAL,
            };
            const mockManager = {
                create: jest.fn().mockReturnValue(savedProject),
                save: jest.fn().mockResolvedValue(savedProject),
                findOne: jest.fn().mockResolvedValue({
                    ...savedProject,
                    columns: [
                        { title: 'To Do', position: 0 },
                        { title: 'Done', position: 1 },
                    ],
                    members: [],
                    owner: {},
                }),
            };

            (dataSource.transaction as jest.Mock).mockImplementation(
                async (cb) => cb(mockManager),
            );

            const result = await service.createProject(userId, dto);

            expect(result).toBeDefined();
            // Verify that create was called for the project entity
            expect(mockManager.create).toHaveBeenCalledWith(
                Project,
                expect.objectContaining({
                    title: 'Minimal Project',
                    template: BoardTemplate.MINIMAL,
                }),
            );
        });

        it('should add creator as OWNER member during project creation', async () => {
            const dto = { title: 'Owner Project' };
            const savedProject = { ...mockProject, id: 'own-id' };
            const mockManager = {
                create: jest.fn().mockReturnValue(savedProject),
                save: jest.fn().mockResolvedValue(savedProject),
                findOne: jest.fn().mockResolvedValue({
                    ...savedProject,
                    columns: [],
                    members: [],
                    owner: {},
                }),
            };

            (dataSource.transaction as jest.Mock).mockImplementation(
                async (cb) => cb(mockManager),
            );

            await service.createProject(userId, dto);

            // The third create call should be for the ProjectMember with OWNER role
            expect(mockManager.create).toHaveBeenCalledWith(
                ProjectMember,
                expect.objectContaining({
                    userId,
                    projectRole: ProjectRole.OWNER,
                }),
            );
        });
    });

    // ─── getProjects ────────────────────────────────────────────────

    describe('getProjects', () => {
        it('should return paginated projects for a user', async () => {
            const filters = { page: 1, limit: 10 };
            const mockResult = {
                data: [mockProject as Project],
                total: 1,
            };

            (
                projectRepository.findProjectsForUser as jest.Mock
            ).mockResolvedValue(mockResult);

            const result = await service.getProjects(userId, filters);

            expect(projectRepository.findProjectsForUser).toHaveBeenCalledWith(
                userId,
                filters,
            );
            expect(result.data).toEqual([mockProject]);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should use default page and limit when not provided', async () => {
            const filters = {};
            const mockResult = { data: [], total: 0 };

            (
                projectRepository.findProjectsForUser as jest.Mock
            ).mockResolvedValue(mockResult);

            const result = await service.getProjects(userId, filters);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });

    // ─── getProjectById ─────────────────────────────────────────────

    describe('getProjectById', () => {
        it('should return the project when user is a member', async () => {
            (projectRepository.findById as jest.Mock)
                .mockResolvedValueOnce(mockProject) // validateMembership -> findById
                .mockResolvedValueOnce({
                    ...mockProject,
                    owner: {},
                    members: [],
                    columns: [],
                }); // getProjectById -> findById with relations
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );

            const result = await service.getProjectById(userId, projectId);

            expect(result).toBeDefined();
            expect(result.id).toBe(projectId);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.getProjectById(userId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.getProjectById('stranger-id', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── getProjectBoard ────────────────────────────────────────────

    describe('getProjectBoard', () => {
        it('should return board with columns and tasks', async () => {
            const boardProject = {
                ...mockProject,
                columns: [
                    { id: 'col-1', title: 'To Do', tasks: [] },
                    { id: 'col-2', title: 'Done', tasks: [] },
                ],
            };
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (
                projectRepository.findProjectWithBoard as jest.Mock
            ).mockResolvedValue(boardProject);

            const result = await service.getProjectBoard(userId, projectId);

            expect(projectRepository.findProjectWithBoard).toHaveBeenCalledWith(
                projectId,
            );
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when board project not found', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (
                projectRepository.findProjectWithBoard as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.getProjectBoard(userId, projectId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── updateProject ──────────────────────────────────────────────

    describe('updateProject', () => {
        it('should update project when user is the owner', async () => {
            const dto = { title: 'Updated Title' };
            const updatedProject = { ...mockProject, title: 'Updated Title' };

            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (projectRepository.update as jest.Mock).mockResolvedValue(
                updatedProject,
            );

            const result = await service.updateProject(userId, projectId, dto);

            expect(result.title).toBe('Updated Title');
        });

        it('should throw ForbiddenException when non-owner tries to update', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.updateProject('user-uuid-2', projectId, {
                    title: 'Hack',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── archiveProject ─────────────────────────────────────────────

    describe('archiveProject', () => {
        it('should set project status to ARCHIVED when owner archives', async () => {
            const archivedProject = {
                ...mockProject,
                status: ProjectStatus.ARCHIVED,
            };
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (projectRepository.update as jest.Mock).mockResolvedValue(
                archivedProject,
            );

            const result = await service.archiveProject(userId, projectId);

            expect(projectRepository.update).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({ status: ProjectStatus.ARCHIVED }),
            );
            expect(result.status).toBe(ProjectStatus.ARCHIVED);
        });

        it('should throw ForbiddenException when non-owner tries to archive', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.archiveProject('user-uuid-2', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── deleteProject ──────────────────────────────────────────────

    describe('deleteProject', () => {
        it('should soft-delete project when owner deletes', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (projectRepository.softDelete as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteProject(userId, projectId),
            ).resolves.toBeUndefined();
            expect(projectRepository.softDelete).toHaveBeenCalledWith(
                projectId,
            );
        });

        it('should throw ForbiddenException when non-owner tries to delete', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(
                mockProject,
            );
            (memberRepo.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.deleteProject('user-uuid-2', projectId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            (projectRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.deleteProject(userId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
