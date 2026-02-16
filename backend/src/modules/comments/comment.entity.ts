import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { Task } from '@modules/tasks/task.entity';
import { User } from '@modules/users/user.entity';

@Entity('comments')
@Index('IDX_comments_task_id', ['taskId'])
@Index('IDX_comments_user_id', ['userId'])
@Index('IDX_comments_parent_id', ['parentId'])
@Index('IDX_comments_task_created_at', ['taskId', 'createdAt'])
export class Comment extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'parent_id', type: 'uuid', nullable: true })
    parentId: string | null;

    @Column({ type: 'text', nullable: false })
    content: string;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Task, (task) => task.comments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @ManyToOne(() => User, (user) => user.comments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Comment, (comment) => comment.replies, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parent_id' })
    parent: Comment | null;

    @OneToMany(() => Comment, (comment) => comment.parent)
    replies: Comment[];
}
