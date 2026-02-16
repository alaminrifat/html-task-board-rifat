import {
    Injectable,
    ForbiddenException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { BaseService } from '@core/base/base.service';
import { ProjectMember } from './project-member.entity';
import { ProjectMemberRepository } from './project-member.repository';
import { Invitation } from '@modules/invitations/invitation.entity';
import { User } from '@modules/users/user.entity';
import { InviteMemberDto } from './dtos';
import { InvitationStatus } from '@shared/enums';

@Injectable()
export class ProjectMembersService extends BaseService<ProjectMember> {
    constructor(
        private readonly projectMemberRepository: ProjectMemberRepository,
        @InjectRepository(Invitation)
        private readonly invitationRepo: Repository<Invitation>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {
        super(projectMemberRepository, 'ProjectMember');
    }

    /**
     * Get all members of a project.
     * Validates that the requesting user is a member of the project.
     */
    async getMembers(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember[]> {
        await this.validateMembership(userId, projectId);
        return this.projectMemberRepository.findMembersByProject(projectId);
    }

    /**
     * Invite a new member to a project by email.
     * Only the project owner can invite members.
     * Checks for existing membership and pending invitations.
     */
    async inviteMember(
        userId: string,
        projectId: string,
        dto: InviteMemberDto,
    ): Promise<Invitation> {
        // Verify the requesting user is the project owner
        const isOwner = await this.isProjectOwner(userId, projectId);
        if (!isOwner) {
            throw new ForbiddenException(
                'Only the project owner can invite members',
            );
        }

        // Check if a user with the given email is already a member
        const existingUser = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            const existingMember =
                await this.projectMemberRepository.findMembership(
                    existingUser.id,
                    projectId,
                );
            if (existingMember) {
                throw new ConflictException(
                    'User is already a member of this project',
                );
            }
        }

        // Check for an existing pending invitation for the same email and project
        const existingInvitation = await this.invitationRepo.findOne({
            where: {
                projectId,
                email: dto.email,
                status: InvitationStatus.PENDING,
            },
        });
        if (existingInvitation) {
            throw new ConflictException(
                'A pending invitation already exists for this email',
            );
        }

        // Create the invitation
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = this.invitationRepo.create({
            projectId,
            inviterId: userId,
            email: dto.email,
            status: InvitationStatus.PENDING,
            token: crypto.randomUUID(),
            expiresAt,
        });

        return this.invitationRepo.save(invitation);
    }

    /**
     * Remove a member from a project (soft delete).
     * Only the project owner can remove members.
     * The owner cannot remove themselves.
     */
    async removeMember(
        userId: string,
        projectId: string,
        targetUserId: string,
    ): Promise<void> {
        const isOwner = await this.isProjectOwner(userId, projectId);
        if (!isOwner) {
            throw new ForbiddenException(
                'Only the project owner can remove members',
            );
        }

        if (userId === targetUserId) {
            throw new ForbiddenException(
                'Project owner cannot remove themselves',
            );
        }

        const membership = await this.projectMemberRepository.findMembership(
            targetUserId,
            projectId,
        );
        if (!membership) {
            throw new NotFoundException('Member not found in this project');
        }

        await this.projectMemberRepository.softDelete(membership.id);
    }

    /**
     * Validate that a user is a member of a project.
     * Throws ForbiddenException if the user is not a member.
     */
    async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const membership = await this.projectMemberRepository.findMembership(
            userId,
            projectId,
        );
        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }
        return membership;
    }

    /**
     * Check whether a user is the owner of a project.
     */
    async isProjectOwner(userId: string, projectId: string): Promise<boolean> {
        return this.projectMemberRepository.isProjectOwner(userId, projectId);
    }
}
