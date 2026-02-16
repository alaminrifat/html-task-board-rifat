import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { ActivityAction } from '@shared/enums';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';
import { User } from '@modules/users/user.entity';

@Entity('activity_logs')
@Index('IDX_activity_logs_project_id', ['projectId'])
@Index('IDX_activity_logs_task_id', ['taskId'])
@Index('IDX_activity_logs_user_id', ['userId'])
@Index('IDX_activity_logs_project_created_at', ['projectId', 'createdAt'])
@Index('IDX_activity_logs_created_at', ['createdAt'])
export class ActivityLog extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @Column({ name: 'task_id', type: 'uuid', nullable: true })
    taskId: string | null;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string | null;

    @Column({
        type: 'enum',
        enum: ActivityAction,
    })
    action: ActivityAction;

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, unknown> | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.activityLogs, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => Task, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task | null;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'user_id' })
    user: User | null;
}
