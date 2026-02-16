import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { BaseService } from '@core/base/base.service';
import { Invitation } from './invitation.entity';
import { InvitationRepository } from './invitation.repository';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { User } from '@modules/users/user.entity';
import { InvitationStatus, ProjectRole } from '@shared/enums';

@Injectable()
export class InvitationsService extends BaseService<Invitation> {
    constructor(
        private readonly invitationRepository: InvitationRepository,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepo: Repository<ProjectMember>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {
        super(invitationRepository, 'Invitation');
    }

    /**
     * Get all invitations for a project.
     * Only the project owner can view invitations.
     */
    async getProjectInvitations(
        userId: string,
        projectId: string,
    ): Promise<Invitation[]> {
        await this.assertProjectOwner(userId, projectId);
        return this.invitationRepository.findByProject(projectId);
    }

    /**
     * Resend an invitation (regenerate token and extend expiry).
     * Only the project owner can resend. Max 3 resends enforced
     * by checking if 3 or more invitations for the same email/project
     * were created in the last 24 hours.
     */
    async resendInvitation(
        userId: string,
        projectId: string,
        invitationId: string,
    ): Promise<Invitation> {
        await this.assertProjectOwner(userId, projectId);

        const invitation =
            await this.invitationRepository.findById(invitationId);
        if (!invitation || invitation.projectId !== projectId) {
            throw new NotFoundException('Invitation not found');
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException(
                'Only pending invitations can be resent',
            );
        }

        // Check resend limit: count invitations for the same email/project created in the last 24h
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentCount = await this.invitationRepository.count({
            where: {
                projectId,
                email: invitation.email,
                createdAt: MoreThan(oneDayAgo),
            },
        });

        if (recentCount >= 3) {
            throw new BadRequestException(
                'Maximum resend limit reached (3 per 24 hours). Please try again later.',
            );
        }

        // Regenerate token and extend expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        invitation.token = crypto.randomUUID();
        invitation.expiresAt = expiresAt;

        return this.invitationRepository.update(invitation.id, {
            token: invitation.token,
            expiresAt: invitation.expiresAt,
        } as any) as unknown as Invitation;
    }

    /**
     * Cancel an invitation by setting its status to CANCELLED.
     * Only the project owner can cancel invitations.
     */
    async cancelInvitation(
        userId: string,
        projectId: string,
        invitationId: string,
    ): Promise<void> {
        await this.assertProjectOwner(userId, projectId);

        const invitation =
            await this.invitationRepository.findById(invitationId);
        if (!invitation || invitation.projectId !== projectId) {
            throw new NotFoundException('Invitation not found');
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException(
                'Only pending invitations can be cancelled',
            );
        }

        await this.invitationRepository.update(invitation.id, {
            status: InvitationStatus.CANCELLED,
        } as any);
    }

    /**
     * Accept an invitation using the unique token.
     * This is a public endpoint (no JWT required).
     * Verifies the token, checks expiry, creates a ProjectMember record,
     * and updates the invitation status to ACCEPTED.
     */
    async acceptInvitation(token: string): Promise<Invitation> {
        const invitation = await this.invitationRepository.findByToken(token);
        if (!invitation) {
            throw new NotFoundException(
                'Invitation not found or already processed',
            );
        }

        // Check expiry
        if (new Date() > invitation.expiresAt) {
            await this.invitationRepository.update(invitation.id, {
                status: InvitationStatus.EXPIRED,
            } as any);
            throw new BadRequestException('Invitation has expired');
        }

        // Find the user by invitation email
        const user = await this.userRepo.findOne({
            where: { email: invitation.email },
        });
        if (!user) {
            throw new NotFoundException(
                'No account found for this email. Please register first.',
            );
        }

        // Check if user is already a member
        const existingMember = await this.projectMemberRepo.findOne({
            where: { userId: user.id, projectId: invitation.projectId },
        });
        if (existingMember) {
            // Mark the invitation as accepted even if already a member
            await this.invitationRepository.update(invitation.id, {
                status: InvitationStatus.ACCEPTED,
            } as any);
            throw new ConflictException(
                'You are already a member of this project',
            );
        }

        // Create the project member record
        const projectMember = this.projectMemberRepo.create({
            userId: user.id,
            projectId: invitation.projectId,
            projectRole: ProjectRole.MEMBER,
            joinedAt: new Date(),
        });
        await this.projectMemberRepo.save(projectMember);

        // Update invitation status to ACCEPTED
        await this.invitationRepository.update(invitation.id, {
            status: InvitationStatus.ACCEPTED,
        } as any);

        invitation.status = InvitationStatus.ACCEPTED;
        return invitation;
    }

    /**
     * Decline an invitation using the unique token.
     * This is a public endpoint (no JWT required).
     * Sets the invitation status to CANCELLED.
     */
    async declineInvitation(token: string): Promise<Invitation> {
        const invitation = await this.invitationRepository.findByToken(token);
        if (!invitation) {
            throw new NotFoundException(
                'Invitation not found or already processed',
            );
        }

        await this.invitationRepository.update(invitation.id, {
            status: InvitationStatus.CANCELLED,
        } as any);

        invitation.status = InvitationStatus.CANCELLED;
        return invitation;
    }

    /**
     * Assert that the given user is the owner of the project.
     * Throws ForbiddenException if not.
     */
    private async assertProjectOwner(
        userId: string,
        projectId: string,
    ): Promise<void> {
        const ownerMember = await this.projectMemberRepo.findOne({
            where: { userId, projectId, projectRole: ProjectRole.OWNER },
        });
        if (!ownerMember) {
            throw new ForbiddenException(
                'Only the project owner can perform this action',
            );
        }
    }
}
