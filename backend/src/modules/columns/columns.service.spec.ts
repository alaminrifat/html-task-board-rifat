import {
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { ColumnsService } from './columns.service';
import { ColumnRepository } from './column.repository';
import { BoardColumn } from './column.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

describe('ColumnsService', () => {
    let service: ColumnsService;
    let columnRepository: jest.Mocked<Partial<ColumnRepository>>;
    let memberRepository: jest.Mocked<Partial<Repository<ProjectMember>>>;
    let dataSource: jest.Mocked<Partial<DataSource>>;

    const userId = 'user-uuid-1';
    const projectId = 'project-uuid-1';
    const columnId = 'column-uuid-1';

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

    const mockColumn: Partial<BoardColumn> = {
        id: columnId,
        projectId,
        title: 'To Do',
        position: 0,
        wipLimit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        columnRepository = {
            findByProject: jest.fn(),
            getMaxPosition: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            hasTasksInColumn: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
        };

        memberRepository = {
            findOne: jest.fn(),
        };

        const mockQueryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                update: jest.fn(),
            },
        };

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };

        service = new ColumnsService(
            columnRepository as any,
            memberRepository as any,
            dataSource as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getColumns ─────────────────────────────────────────────────

    describe('getColumns', () => {
        it('should return columns ordered by position for a project member', async () => {
            const columns = [
                { ...mockColumn, position: 0 },
                {
                    ...mockColumn,
                    id: 'col-2',
                    title: 'In Progress',
                    position: 1,
                },
                { ...mockColumn, id: 'col-3', title: 'Done', position: 2 },
            ] as BoardColumn[];

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findByProject as jest.Mock).mockResolvedValue(
                columns,
            );

            const result = await service.getColumns(userId, projectId);

            expect(memberRepository.findOne).toHaveBeenCalledWith({
                where: { userId, projectId },
            });
            expect(columnRepository.findByProject).toHaveBeenCalledWith(
                projectId,
            );
            expect(result).toHaveLength(3);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.getColumns('stranger-id', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── createColumn ───────────────────────────────────────────────

    describe('createColumn', () => {
        it('should create a column with auto-assigned position', async () => {
            const dto = { title: 'New Column' };
            const createdColumn = {
                ...mockColumn,
                title: 'New Column',
                position: 3,
            };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.getMaxPosition as jest.Mock).mockResolvedValue(2);
            (columnRepository.create as jest.Mock).mockResolvedValue(
                createdColumn,
            );

            const result = await service.createColumn(userId, projectId, dto);

            expect(columnRepository.getMaxPosition).toHaveBeenCalledWith(
                projectId,
            );
            expect(columnRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId,
                    title: 'New Column',
                    position: 3,
                    wipLimit: null,
                }),
            );
            expect(result.position).toBe(3);
        });

        it('should create a column with wipLimit when provided', async () => {
            const dto = { title: 'Limited Column', wipLimit: 5 };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.getMaxPosition as jest.Mock).mockResolvedValue(0);
            (columnRepository.create as jest.Mock).mockResolvedValue({
                ...mockColumn,
                title: 'Limited Column',
                wipLimit: 5,
                position: 1,
            });

            const result = await service.createColumn(userId, projectId, dto);

            expect(columnRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ wipLimit: 5 }),
            );
            expect(result.wipLimit).toBe(5);
        });

        it('should throw ForbiddenException when non-owner tries to create column', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.createColumn('user-uuid-2', projectId, {
                    title: 'Fail',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should create first column at position 0 when no columns exist', async () => {
            const dto = { title: 'First Column' };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.getMaxPosition as jest.Mock).mockResolvedValue(
                -1,
            );
            (columnRepository.create as jest.Mock).mockResolvedValue({
                ...mockColumn,
                title: 'First Column',
                position: 0,
            });

            await service.createColumn(userId, projectId, dto);

            expect(columnRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ position: 0 }),
            );
        });
    });

    // ─── updateColumn ───────────────────────────────────────────────

    describe('updateColumn', () => {
        it('should update column title when owner updates', async () => {
            const dto = { title: 'Updated Title' };
            const updatedColumn = { ...mockColumn, title: 'Updated Title' };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(
                mockColumn,
            );
            (columnRepository.update as jest.Mock).mockResolvedValue(
                updatedColumn,
            );

            const result = await service.updateColumn(
                userId,
                projectId,
                columnId,
                dto,
            );

            expect(columnRepository.update).toHaveBeenCalledWith(
                columnId,
                expect.objectContaining({ title: 'Updated Title' }),
            );
            expect(result.title).toBe('Updated Title');
        });

        it('should update wipLimit', async () => {
            const dto = { wipLimit: 10 };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(
                mockColumn,
            );
            (columnRepository.update as jest.Mock).mockResolvedValue({
                ...mockColumn,
                wipLimit: 10,
            });

            const result = await service.updateColumn(
                userId,
                projectId,
                columnId,
                dto,
            );

            expect(result.wipLimit).toBe(10);
        });

        it('should throw NotFoundException when column not found in project', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.updateColumn(userId, projectId, 'nonexistent', {
                    title: 'X',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when column belongs to a different project', async () => {
            const otherProjectColumn = {
                ...mockColumn,
                projectId: 'other-project-id',
            };
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(
                otherProjectColumn,
            );

            await expect(
                service.updateColumn(userId, projectId, columnId, {
                    title: 'X',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when non-owner tries to update', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.updateColumn('user-uuid-2', projectId, columnId, {
                    title: 'Hack',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── deleteColumn ───────────────────────────────────────────────

    describe('deleteColumn', () => {
        it('should delete column when it has no tasks', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(
                mockColumn,
            );
            (columnRepository.hasTasksInColumn as jest.Mock).mockResolvedValue(
                false,
            );
            (columnRepository.delete as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteColumn(userId, projectId, columnId),
            ).resolves.toBeUndefined();

            expect(columnRepository.delete).toHaveBeenCalledWith(columnId);
        });

        it('should throw BadRequestException when column contains tasks', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findById as jest.Mock).mockResolvedValue(
                mockColumn,
            );
            (columnRepository.hasTasksInColumn as jest.Mock).mockResolvedValue(
                true,
            );

            await expect(
                service.deleteColumn(userId, projectId, columnId),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException when non-owner tries to delete', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.deleteColumn('user-uuid-2', projectId, columnId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── reorderColumns ─────────────────────────────────────────────

    describe('reorderColumns', () => {
        it('should batch reorder columns within a transaction', async () => {
            const dto = {
                columns: [
                    { id: 'col-1', position: 2 },
                    { id: 'col-2', position: 0 },
                    { id: 'col-3', position: 1 },
                ],
            };

            const reorderedColumns = [
                { id: 'col-2', position: 0 },
                { id: 'col-3', position: 1 },
                { id: 'col-1', position: 2 },
            ] as BoardColumn[];

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: {
                    update: jest.fn(),
                },
            };

            (dataSource.createQueryRunner as jest.Mock).mockReturnValue(
                mockQueryRunner,
            );
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (columnRepository.findByProject as jest.Mock).mockResolvedValue(
                reorderedColumns,
            );

            const result = await service.reorderColumns(userId, projectId, dto);

            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
            expect(result).toEqual(reorderedColumns);
        });

        it('should rollback transaction on error', async () => {
            const dto = {
                columns: [{ id: 'col-1', position: 0 }],
            };

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: {
                    update: jest.fn().mockRejectedValue(new Error('DB error')),
                },
            };

            (dataSource.createQueryRunner as jest.Mock).mockReturnValue(
                mockQueryRunner,
            );
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );

            await expect(
                service.reorderColumns(userId, projectId, dto),
            ).rejects.toThrow('DB error');

            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when non-owner tries to reorder', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.reorderColumns('user-uuid-2', projectId, {
                    columns: [],
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
