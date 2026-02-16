import {
    ForbiddenException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProjectMembersService } from './project-members.service';
import { ProjectMemberRepository } from './project-member.repository';
import { ProjectMember } from './project-member.entity';
import { Invitation } from '@modules/invitations/invitation.entity';
import { User } from '@modules/users/user.entity';
import { ProjectRole, InvitationStatus } from '@shared/enums';

describe('ProjectMembersService', () => {
    let service: ProjectMembersService;
    let projectMemberRepository: jest.Mocked<Partial<ProjectMemberRepository>>;
    let invitationRepo: jest.Mocked<Partial<Repository<Invitation>>>;
    let userRepo: jest.Mocked<Partial<Repository<User>>>;

    const ownerId = 'owner-uuid-1';
    const memberId = 'member-uuid-1';
    const projectId = 'project-uuid-1';
    const targetUserId = 'target-uuid-1';

    const mockOwnerMember: Partial<ProjectMember> = {
        id: 'pm-uuid-1',
        projectId,
        userId: ownerId,
        projectRole: ProjectRole.OWNER,
    };

    const mockRegularMember: Partial<ProjectMember> = {
        id: 'pm-uuid-2',
        projectId,
        userId: targetUserId,
        projectRole: ProjectRole.MEMBER,
    };

    beforeEach(async () => {
        projectMemberRepository = {
            findMembersByProject: jest.fn(),
            findMembership: jest.fn(),
            isProjectOwner: jest.fn(),
            softDelete: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
        };

        invitationRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        userRepo = {
            findOne: jest.fn(),
        };

        service = new ProjectMembersService(
            projectMemberRepository as any,
            invitationRepo as any,
            userRepo as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getMembers ─────────────────────────────────────────────────

    describe('getMembers', () => {
        it('should return all members of a project', async () => {
            const members = [
                mockOwnerMember,
                mockRegularMember,
            ] as ProjectMember[];

            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(mockOwnerMember);
            (
                projectMemberRepository.findMembersByProject as jest.Mock
            ).mockResolvedValue(members);

            const result = await service.getMembers(ownerId, projectId);

            expect(projectMemberRepository.findMembership).toHaveBeenCalledWith(
                ownerId,
                projectId,
            );
            expect(
                projectMemberRepository.findMembersByProject,
            ).toHaveBeenCalledWith(projectId);
            expect(result).toHaveLength(2);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.getMembers('stranger-id', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── inviteMember ───────────────────────────────────────────────

    describe('inviteMember', () => {
        const inviteDto = { email: 'new@example.com' };

        it('should create an invitation when valid', async () => {
            const savedInvitation = {
                id: 'inv-uuid-1',
                projectId,
                inviterId: ownerId,
                email: 'new@example.com',
                status: InvitationStatus.PENDING,
                token: 'some-token',
            };

            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (userRepo.findOne as jest.Mock).mockResolvedValue(null); // no existing user with email
            (invitationRepo.findOne as jest.Mock).mockResolvedValue(null); // no pending invitation
            (invitationRepo.create as jest.Mock).mockReturnValue(
                savedInvitation,
            );
            (invitationRepo.save as jest.Mock).mockResolvedValue(
                savedInvitation,
            );

            const result = await service.inviteMember(
                ownerId,
                projectId,
                inviteDto,
            );

            expect(projectMemberRepository.isProjectOwner).toHaveBeenCalledWith(
                ownerId,
                projectId,
            );
            expect(invitationRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId,
                    inviterId: ownerId,
                    email: 'new@example.com',
                    status: InvitationStatus.PENDING,
                }),
            );
            expect(result).toBeDefined();
        });

        it('should throw ForbiddenException when non-owner tries to invite', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(false);

            await expect(
                service.inviteMember(memberId, projectId, inviteDto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ConflictException when user is already a member', async () => {
            const existingUser = {
                id: 'existing-user-id',
                email: 'new@example.com',
            };

            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(mockRegularMember);

            await expect(
                service.inviteMember(ownerId, projectId, inviteDto),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException when a pending invitation already exists', async () => {
            const existingInvitation = {
                id: 'inv-existing',
                email: 'new@example.com',
                status: InvitationStatus.PENDING,
            };

            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (userRepo.findOne as jest.Mock).mockResolvedValue(null);
            (invitationRepo.findOne as jest.Mock).mockResolvedValue(
                existingInvitation,
            );

            await expect(
                service.inviteMember(ownerId, projectId, inviteDto),
            ).rejects.toThrow(ConflictException);
        });

        it('should allow invitation when user exists but is not a member', async () => {
            const existingUser = {
                id: 'existing-user-id',
                email: 'new@example.com',
            };
            const savedInvitation = {
                id: 'inv-uuid-1',
                projectId,
                email: 'new@example.com',
                status: InvitationStatus.PENDING,
            };

            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(null); // not a member
            (invitationRepo.findOne as jest.Mock).mockResolvedValue(null); // no pending invitation
            (invitationRepo.create as jest.Mock).mockReturnValue(
                savedInvitation,
            );
            (invitationRepo.save as jest.Mock).mockResolvedValue(
                savedInvitation,
            );

            const result = await service.inviteMember(
                ownerId,
                projectId,
                inviteDto,
            );

            expect(result).toBeDefined();
        });
    });

    // ─── removeMember ───────────────────────────────────────────────

    describe('removeMember', () => {
        it('should remove a member when owner removes', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(mockRegularMember);
            (projectMemberRepository.softDelete as jest.Mock).mockResolvedValue(
                true,
            );

            await expect(
                service.removeMember(ownerId, projectId, targetUserId),
            ).resolves.toBeUndefined();

            expect(projectMemberRepository.softDelete).toHaveBeenCalledWith(
                'pm-uuid-2',
            );
        });

        it('should throw ForbiddenException when non-owner tries to remove', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(false);

            await expect(
                service.removeMember(targetUserId, projectId, ownerId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when owner tries to remove themselves', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);

            await expect(
                service.removeMember(ownerId, projectId, ownerId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when target member not found', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.removeMember(ownerId, projectId, 'nonexistent-user'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── validateMembership ─────────────────────────────────────────

    describe('validateMembership', () => {
        it('should return the membership when user is a member', async () => {
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(mockOwnerMember);

            const result = await service.validateMembership(ownerId, projectId);

            expect(result).toBeDefined();
            expect(result.userId).toBe(ownerId);
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            (
                projectMemberRepository.findMembership as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.validateMembership('stranger-id', projectId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── isProjectOwner ─────────────────────────────────────────────

    describe('isProjectOwner', () => {
        it('should return true when user is the owner', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(true);

            const result = await service.isProjectOwner(ownerId, projectId);

            expect(result).toBe(true);
            expect(projectMemberRepository.isProjectOwner).toHaveBeenCalledWith(
                ownerId,
                projectId,
            );
        });

        it('should return false when user is not the owner', async () => {
            (
                projectMemberRepository.isProjectOwner as jest.Mock
            ).mockResolvedValue(false);

            const result = await service.isProjectOwner(
                targetUserId,
                projectId,
            );

            expect(result).toBe(false);
        });
    });
});
