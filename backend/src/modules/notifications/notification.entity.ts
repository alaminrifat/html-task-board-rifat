import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { NotificationType } from '@shared/enums';
import { User } from '@modules/users/user.entity';
import { Task } from '@modules/tasks/task.entity';
import { Project } from '@modules/projects/project.entity';

@Entity('notifications')
@Index('IDX_notifications_user_id', ['userId'])
@Index('IDX_notifications_user_is_read', ['userId', 'isRead'])
@Index('IDX_notifications_user_created_at', ['userId', 'createdAt'])
export class Notification extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'task_id', type: 'uuid', nullable: true })
    taskId: string | null;

    @Column({ name: 'project_id', type: 'uuid', nullable: true })
    projectId: string | null;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => User, (user) => user.notifications, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Task, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task | null;

    @ManyToOne(() => Project, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project | null;
}
