import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationRepository } from './invitation.repository';
import { Invitation } from './invitation.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { User } from '@modules/users/user.entity';
import { ProjectMembersModule } from '@modules/project-members/project-members.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invitation, ProjectMember, User]),
        ProjectMembersModule,
    ],
    controllers: [InvitationsController],
    providers: [InvitationsService, InvitationRepository],
    exports: [InvitationsService, InvitationRepository],
})
export class InvitationsModule {}
