import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import { ProjectMembersService } from './project-members.service';
import { InviteMemberDto } from './dtos';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import type { IJwtPayload } from '@shared/interfaces';
import { ProjectMember } from './project-member.entity';
import { Invitation } from '@modules/invitations/invitation.entity';

@ApiTags('Project Members')
@Controller('projects/:projectId/members')
export class ProjectMembersController {
    constructor(
        private readonly projectMembersService: ProjectMembersService,
    ) {}

    /**
     * GET /projects/:projectId/members
     * List all members of a project. Requires project membership.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project Members',
        operation: 'getAll',
        summary: 'List all members of a project',
    })
    async getMembers(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<ProjectMember[]>> {
        const members = await this.projectMembersService.getMembers(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            members,
            'Project members retrieved successfully',
        );
    }

    /**
     * POST /projects/:projectId/members/invite
     * Invite a user to the project by email. Owner-only.
     */
    @Post('invite')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Project Invitation',
        operation: 'create',
        successStatus: 201,
        summary: 'Invite a member to the project by email',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can invite members',
            },
            {
                status: 409,
                description:
                    'User already a member or pending invitation exists',
            },
        ],
    })
    async inviteMember(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: InviteMemberDto,
    ): Promise<CreatedResponseDto<Invitation>> {
        const invitation = await this.projectMembersService.inviteMember(
            user.id,
            projectId,
            dto,
        );
        return new CreatedResponseDto(
            invitation,
            'Invitation sent successfully',
        );
    }

    /**
     * DELETE /projects/:projectId/members/:userId
     * Remove a member from the project. Owner-only. Cannot remove self.
     */
    @Delete(':userId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Project Member',
        operation: 'delete',
        summary: 'Remove a member from the project',
        paramName: 'userId',
        errors: [
            {
                status: 403,
                description: 'Only the project owner can remove members',
            },
            { status: 404, description: 'Member not found in this project' },
        ],
    })
    async removeMember(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<DeletedResponseDto> {
        await this.projectMembersService.removeMember(
            user.id,
            projectId,
            userId,
        );
        return new DeletedResponseDto(
            'Member removed from project successfully',
        );
    }
}
