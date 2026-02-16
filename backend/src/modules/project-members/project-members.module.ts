import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { ProjectMemberRepository } from './project-member.repository';
import { ProjectMember } from './project-member.entity';
import { Invitation } from '@modules/invitations/invitation.entity';
import { User } from '@modules/users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ProjectMember, Invitation, User])],
    controllers: [ProjectMembersController],
    providers: [ProjectMembersService, ProjectMemberRepository],
    exports: [ProjectMembersService, ProjectMemberRepository],
})
export class ProjectMembersModule {}
