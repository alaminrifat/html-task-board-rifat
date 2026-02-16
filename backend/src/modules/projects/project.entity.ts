import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { ProjectStatus, BoardTemplate } from '@shared/enums';
import { User } from '@modules/users/user.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { Task } from '@modules/tasks/task.entity';
import { Label } from '@modules/labels/label.entity';
import { Invitation } from '@modules/invitations/invitation.entity';
import { ActivityLog } from '@modules/activity-logs/activity-log.entity';

@Entity('projects')
@Index('IDX_projects_owner_id', ['ownerId'])
@Index('IDX_projects_status', ['status'])
@Index('IDX_projects_created_at', ['createdAt'])
@Index('IDX_projects_deadline', ['deadline'])
export class Project extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.ACTIVE,
    })
    status: ProjectStatus;

    @Column({
        type: 'enum',
        enum: BoardTemplate,
        default: BoardTemplate.DEFAULT,
    })
    template: BoardTemplate;

    @Column({ type: 'date', nullable: true })
    deadline: Date | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @OneToMany(() => ProjectMember, (pm) => pm.project)
    members: ProjectMember[];

    @OneToMany(() => BoardColumn, (col) => col.project)
    columns: BoardColumn[];

    @OneToMany(() => Task, (task) => task.project)
    tasks: Task[];

    @OneToMany(() => Label, (label) => label.project)
    labels: Label[];

    @OneToMany(() => Invitation, (inv) => inv.project)
    invitations: Invitation[];

    @OneToMany(() => ActivityLog, (log) => log.project)
    activityLogs: ActivityLog[];
}
