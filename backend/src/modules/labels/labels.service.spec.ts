import {
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { LabelsService } from './labels.service';
import { LabelRepository } from './label.repository';
import { Label } from './label.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

describe('LabelsService', () => {
    let service: LabelsService;
    let labelRepository: jest.Mocked<Partial<LabelRepository>>;
    let memberRepository: jest.Mocked<Partial<Repository<ProjectMember>>>;

    const userId = 'user-uuid-1';
    const projectId = 'project-uuid-1';
    const labelId = 'label-uuid-1';

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

    const mockProjectLabel: Partial<Label> = {
        id: labelId,
        projectId,
        name: 'Bug',
        color: '#FF0000',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockSystemLabel: Partial<Label> = {
        id: 'system-label-uuid',
        projectId: null,
        name: 'Urgent',
        color: '#FF5500',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        labelRepository = {
            findByProject: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
        };

        memberRepository = {
            findOne: jest.fn(),
        };

        service = new LabelsService(
            labelRepository as any,
            memberRepository as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getLabels ──────────────────────────────────────────────────

    describe('getLabels', () => {
        it('should return project labels and system labels', async () => {
            const labels = [mockProjectLabel, mockSystemLabel] as Label[];

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findByProject as jest.Mock).mockResolvedValue(
                labels,
            );

            const result = await service.getLabels(userId, projectId);

            expect(memberRepository.findOne).toHaveBeenCalledWith({
                where: { userId, projectId },
            });
            expect(labelRepository.findByProject).toHaveBeenCalledWith(
                projectId,
            );
            expect(result).toHaveLength(2);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.getLabels('stranger-id', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── createLabel ────────────────────────────────────────────────

    describe('createLabel', () => {
        it('should create a project-scoped label when owner creates', async () => {
            const dto = { name: 'Feature', color: '#00FF00' };
            const createdLabel = {
                ...mockProjectLabel,
                name: 'Feature',
                color: '#00FF00',
            };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.create as jest.Mock).mockResolvedValue(
                createdLabel,
            );

            const result = await service.createLabel(userId, projectId, dto);

            expect(labelRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId,
                    name: 'Feature',
                    color: '#00FF00',
                }),
            );
            expect(result.name).toBe('Feature');
        });

        it('should throw ForbiddenException when non-owner tries to create', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.createLabel('user-uuid-2', projectId, {
                    name: 'X',
                    color: '#000',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when non-member tries to create', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.createLabel('stranger-id', projectId, {
                    name: 'X',
                    color: '#000',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── updateLabel ────────────────────────────────────────────────

    describe('updateLabel', () => {
        it('should update label name when owner updates', async () => {
            const dto = { name: 'Critical Bug' };
            const updatedLabel = { ...mockProjectLabel, name: 'Critical Bug' };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                mockProjectLabel,
            );
            (labelRepository.update as jest.Mock).mockResolvedValue(
                updatedLabel,
            );

            const result = await service.updateLabel(
                userId,
                projectId,
                labelId,
                dto,
            );

            expect(labelRepository.update).toHaveBeenCalledWith(
                labelId,
                expect.objectContaining({ name: 'Critical Bug' }),
            );
            expect(result.name).toBe('Critical Bug');
        });

        it('should update label color', async () => {
            const dto = { color: '#0000FF' };
            const updatedLabel = { ...mockProjectLabel, color: '#0000FF' };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                mockProjectLabel,
            );
            (labelRepository.update as jest.Mock).mockResolvedValue(
                updatedLabel,
            );

            const result = await service.updateLabel(
                userId,
                projectId,
                labelId,
                dto,
            );

            expect(result.color).toBe('#0000FF');
        });

        it('should throw NotFoundException when label does not exist', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.updateLabel(userId, projectId, 'nonexistent', {
                    name: 'X',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when trying to update a system label', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                mockSystemLabel,
            );

            await expect(
                service.updateLabel(userId, projectId, 'system-label-uuid', {
                    name: 'Changed',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when label belongs to a different project', async () => {
            const otherProjectLabel = {
                ...mockProjectLabel,
                projectId: 'other-project-id',
            };

            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                otherProjectLabel,
            );

            await expect(
                service.updateLabel(userId, projectId, labelId, { name: 'X' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when non-owner tries to update', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.updateLabel('user-uuid-2', projectId, labelId, {
                    name: 'Hack',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── deleteLabel ────────────────────────────────────────────────

    describe('deleteLabel', () => {
        it('should delete a project label when owner deletes', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                mockProjectLabel,
            );
            (labelRepository.delete as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteLabel(userId, projectId, labelId),
            ).resolves.toBeUndefined();

            expect(labelRepository.delete).toHaveBeenCalledWith(labelId);
        });

        it('should throw BadRequestException when trying to delete a system label', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(
                mockSystemLabel,
            );

            await expect(
                service.deleteLabel(userId, projectId, 'system-label-uuid'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when label not found', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (labelRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.deleteLabel(userId, projectId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when non-owner tries to delete', async () => {
            (memberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );

            await expect(
                service.deleteLabel('user-uuid-2', projectId, labelId),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
