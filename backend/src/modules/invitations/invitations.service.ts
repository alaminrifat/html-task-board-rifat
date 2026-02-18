import {
    Injectable,
    Logger,
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
import { MailService } from '@infrastructure/mail';
import { envConfigService } from 'src/config/env-config.service';

@Injectable()
export class InvitationsService extends BaseService<Invitation> {
    private readonly logger = new Logger(InvitationsService.name);

    constructor(
        private readonly invitationRepository: InvitationRepository,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepo: Repository<ProjectMember>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailService: MailService,
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

        await this.invitationRepository.update(invitation.id, {
            token: invitation.token,
            expiresAt: invitation.expiresAt,
        } as any);

        // Send invitation email (non-blocking)
        try {
            const fullInvitation = await this.invitationRepository.findByToken(
                invitation.token,
            );
            const frontendUrl = envConfigService.getFrontendUrl();
            const acceptUrl = `${frontendUrl}/invitations/accept?token=${invitation.token}`;

            await this.mailService.sendInvitationEmail(
                invitation.email,
                fullInvitation?.project?.title || 'a project',
                fullInvitation?.inviter?.fullName || 'A team member',
                acceptUrl,
            );
        } catch (error) {
            this.logger.warn(
                `Failed to resend invitation email to ${invitation.email}: ${error.message}`,
            );
        }

        return invitation;
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
     * Get invitation details by token (public preview).
     */
    async getInvitationByToken(token: string): Promise<Invitation> {
        const invitation = await this.invitationRepository.findByToken(token);
        if (!invitation) {
            throw new NotFoundException(
                'Invitation not found or already processed',
            );
        }

        if (new Date() > invitation.expiresAt) {
            await this.invitationRepository.update(invitation.id, {
                status: InvitationStatus.EXPIRED,
            } as any);
            throw new BadRequestException('Invitation has expired');
        }

        return invitation;
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
     * Get a pending invitation for the authenticated user by projectId.
     * Returns the invitation with project and inviter relations for preview.
     */
    async getInvitationByProject(
        email: string,
        projectId: string,
    ): Promise<Invitation> {
        const invitation = await this.invitationRepository.findOne(
            { projectId, email, status: InvitationStatus.PENDING },
            { project: true, inviter: true },
        );
        if (!invitation) {
            throw new NotFoundException(
                'No pending invitation found for this project',
            );
        }

        if (new Date() > invitation.expiresAt) {
            await this.invitationRepository.update(invitation.id, {
                status: InvitationStatus.EXPIRED,
            } as any);
            throw new BadRequestException('Invitation has expired');
        }

        return invitation;
    }

    /**
     * Accept an invitation for the authenticated user by projectId.
     * Looks up the pending invitation via projectId + user email,
     * then delegates to the existing token-based acceptInvitation().
     */
    async acceptInvitationByProject(
        email: string,
        projectId: string,
    ): Promise<Invitation> {
        const invitation = await this.invitationRepository.findOne({
            projectId,
            email,
            status: InvitationStatus.PENDING,
        });
        if (!invitation) {
            throw new NotFoundException(
                'No pending invitation found for this project',
            );
        }
        return this.acceptInvitation(invitation.token);
    }

    /**
     * Decline an invitation for the authenticated user by projectId.
     * Looks up the pending invitation via projectId + user email,
     * then delegates to the existing token-based declineInvitation().
     */
    async declineInvitationByProject(
        email: string,
        projectId: string,
    ): Promise<Invitation> {
        const invitation = await this.invitationRepository.findOne({
            projectId,
            email,
            status: InvitationStatus.PENDING,
        });
        if (!invitation) {
            throw new NotFoundException(
                'No pending invitation found for this project',
            );
        }
        return this.declineInvitation(invitation.token);
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
