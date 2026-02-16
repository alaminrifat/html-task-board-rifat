import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { ProjectRole } from '@shared/enums';
import { Project } from '@modules/projects/project.entity';
import { User } from '@modules/users/user.entity';

@Entity('project_members')
@Unique('UQ_project_members_project_user', ['projectId', 'userId'])
@Index('IDX_project_members_project_id', ['projectId'])
@Index('IDX_project_members_user_id', ['userId'])
export class ProjectMember extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({
        name: 'project_role',
        type: 'enum',
        enum: ProjectRole,
        default: ProjectRole.MEMBER,
    })
    projectRole: ProjectRole;

    @Column({
        name: 'joined_at',
        type: 'timestamptz',
        default: () => 'NOW()',
    })
    joinedAt: Date;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.members, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, (user) => user.projectMembers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
