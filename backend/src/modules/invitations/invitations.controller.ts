import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger, CurrentUser, Public } from '@core/decorators';
import { InvitationsService } from './invitations.service';
import { SuccessResponseDto, DeletedResponseDto } from '@shared/dtos';
import type { IJwtPayload } from '@shared/interfaces';
import { Invitation } from './invitation.entity';

@ApiTags('Invitations')
@Controller()
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) {}

    // ─── Project-scoped endpoints (require auth + owner) ──────────────

    /**
     * GET /projects/:projectId/invitations
     * List all invitations for a project. Owner-only.
     */
    @Get('projects/:projectId/invitations')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project Invitations',
        operation: 'getAll',
        summary: 'List all invitations for a project',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can view invitations',
            },
        ],
    })
    async getProjectInvitations(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Invitation[]>> {
        const invitations = await this.invitationsService.getProjectInvitations(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            invitations,
            'Invitations retrieved successfully',
        );
    }

    /**
     * POST /projects/:projectId/invitations/:id/resend
     * Resend an invitation. Owner-only. Max 3 resends per 24 hours.
     */
    @Post('projects/:projectId/invitations/:id/resend')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'custom',
        summary: 'Resend a project invitation',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can resend invitations',
            },
            { status: 404, description: 'Invitation not found' },
            {
                status: 400,
                description:
                    'Maximum resend limit reached or invitation is not pending',
            },
        ],
    })
    async resendInvitation(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation = await this.invitationsService.resendInvitation(
            user.id,
            projectId,
            id,
        );
        return new SuccessResponseDto(
            invitation,
            'Invitation resent successfully',
        );
    }

    /**
     * DELETE /projects/:projectId/invitations/:id
     * Cancel an invitation. Owner-only.
     */
    @Delete('projects/:projectId/invitations/:id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'delete',
        summary: 'Cancel a project invitation',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can cancel invitations',
            },
            { status: 404, description: 'Invitation not found' },
            {
                status: 400,
                description: 'Only pending invitations can be cancelled',
            },
        ],
    })
    async cancelInvitation(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DeletedResponseDto> {
        await this.invitationsService.cancelInvitation(user.id, projectId, id);
        return new DeletedResponseDto('Invitation cancelled successfully');
    }

    // ─── Authenticated endpoints (accept/decline by project) ──────────

    /**
     * GET /invitations/project/:projectId
     * Get pending invitation details for the authenticated user by projectId.
     */
    @Get('invitations/project/:projectId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'getOne',
        summary: 'Get pending invitation by project ID (authenticated)',
        errors: [
            { status: 404, description: 'No pending invitation found' },
            { status: 400, description: 'Invitation has expired' },
        ],
    })
    async getInvitationByProject(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation = await this.invitationsService.getInvitationByProject(
            user.email,
            projectId,
        );
        return new SuccessResponseDto(
            invitation,
            'Invitation retrieved successfully',
        );
    }

    /**
     * POST /invitations/project/:projectId/accept
     * Accept an invitation for the authenticated user by projectId.
     */
    @Post('invitations/project/:projectId/accept')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'custom',
        summary: 'Accept invitation by project ID (authenticated)',
        errors: [
            { status: 404, description: 'No pending invitation found' },
            { status: 400, description: 'Invitation has expired' },
            { status: 409, description: 'Already a member of this project' },
        ],
    })
    async acceptInvitationByProject(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation =
            await this.invitationsService.acceptInvitationByProject(
                user.email,
                projectId,
            );
        return new SuccessResponseDto(
            invitation,
            'Invitation accepted successfully',
        );
    }

    /**
     * POST /invitations/project/:projectId/decline
     * Decline an invitation for the authenticated user by projectId.
     */
    @Post('invitations/project/:projectId/decline')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'custom',
        summary: 'Decline invitation by project ID (authenticated)',
        errors: [{ status: 404, description: 'No pending invitation found' }],
    })
    async declineInvitationByProject(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation =
            await this.invitationsService.declineInvitationByProject(
                user.email,
                projectId,
            );
        return new SuccessResponseDto(
            invitation,
            'Invitation declined successfully',
        );
    }

    // ─── Public token-based endpoints (no JWT required) ───────────────

    /**
     * GET /invitations/:token
     * Preview invitation details. No auth required.
     */
    @Public()
    @Get('invitations/:token')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'getOne',
        summary: 'Get invitation details by token',
        requiresAuth: false,
        errors: [
            {
                status: 404,
                description: 'Invitation not found or already processed',
            },
        ],
    })
    async getInvitationByToken(
        @Param('token') token: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation =
            await this.invitationsService.getInvitationByToken(token);
        return new SuccessResponseDto(
            invitation,
            'Invitation retrieved successfully',
        );
    }

    /**
     * POST /invitations/:token/accept
     * Accept an invitation using the unique token. No auth required.
     */
    @Public()
    @Post('invitations/:token/accept')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'custom',
        summary: 'Accept an invitation by token',
        requiresAuth: false,
        errors: [
            {
                status: 404,
                description: 'Invitation not found or already processed',
            },
            { status: 400, description: 'Invitation has expired' },
            { status: 409, description: 'Already a member of this project' },
        ],
    })
    async acceptInvitation(
        @Param('token') token: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation =
            await this.invitationsService.acceptInvitation(token);
        return new SuccessResponseDto(
            invitation,
            'Invitation accepted successfully',
        );
    }

    /**
     * POST /invitations/:token/decline
     * Decline an invitation using the unique token. No auth required.
     */
    @Public()
    @Post('invitations/:token/decline')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Invitation',
        operation: 'custom',
        summary: 'Decline an invitation by token',
        requiresAuth: false,
        errors: [
            {
                status: 404,
                description: 'Invitation not found or already processed',
            },
        ],
    })
    async declineInvitation(
        @Param('token') token: string,
    ): Promise<SuccessResponseDto<Invitation>> {
        const invitation =
            await this.invitationsService.declineInvitation(token);
        return new SuccessResponseDto(
            invitation,
            'Invitation declined successfully',
        );
    }
}
