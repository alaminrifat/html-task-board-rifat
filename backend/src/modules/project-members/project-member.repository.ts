import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { ProjectMember } from './project-member.entity';
import { ProjectRole } from '@shared/enums';

@Injectable()
export class ProjectMemberRepository extends BaseRepository<ProjectMember> {
    constructor(
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) {
        super(projectMemberRepository);
    }

    /**
     * Find all members of a project with user relations loaded
     */
    async findMembersByProject(projectId: string): Promise<ProjectMember[]> {
        return this.projectMemberRepository.find({
            where: { projectId },
            relations: { user: true },
            order: { joinedAt: 'ASC' },
        });
    }

    /**
     * Find a specific membership record for a user in a project
     */
    async findMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember | null> {
        return this.projectMemberRepository.findOne({
            where: { userId, projectId },
            relations: { user: true },
        });
    }

    /**
     * Check if a user is the owner of a project
     */
    async isProjectOwner(userId: string, projectId: string): Promise<boolean> {
        const member = await this.projectMemberRepository.findOne({
            where: { userId, projectId, projectRole: ProjectRole.OWNER },
        });
        return !!member;
    }
}
