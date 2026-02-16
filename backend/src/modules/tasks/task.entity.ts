import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinColumn,
    JoinTable,
    Index,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { TaskPriority } from '@shared/enums';
import { Project } from '@modules/projects/project.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { User } from '@modules/users/user.entity';
import { SubTask } from '@modules/sub-tasks/sub-task.entity';
import { Comment } from '@modules/comments/comment.entity';
import { Attachment } from '@modules/attachments/attachment.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { Label } from '@modules/labels/label.entity';

@Entity('tasks')
@Index('IDX_tasks_project_id', ['projectId'])
@Index('IDX_tasks_column_id', ['columnId'])
@Index('IDX_tasks_assignee_id', ['assigneeId'])
@Index('IDX_tasks_creator_id', ['creatorId'])
@Index('IDX_tasks_priority', ['priority'])
@Index('IDX_tasks_due_date', ['dueDate'])
@Index('IDX_tasks_column_position', ['columnId', 'position'])
@Index('IDX_tasks_deleted_at', ['deletedAt'])
export class Task extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @Column({ name: 'column_id', type: 'uuid' })
    columnId: string;

    @Column({ name: 'creator_id', type: 'uuid', nullable: true })
    creatorId: string | null;

    @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
    assigneeId: string | null;

    @Column({ type: 'varchar', length: 500, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;

    @Column({ name: 'due_date', type: 'date', nullable: true })
    dueDate: Date | null;

    @Column({ type: 'integer', default: 0 })
    position: number;

    @Column({ name: 'deleted_by_id', type: 'uuid', nullable: true })
    deletedById: string | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.tasks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => BoardColumn, (column) => column.tasks, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'column_id' })
    column: BoardColumn;

    @ManyToOne(() => User, (user) => user.createdTasks, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'creator_id' })
    creator: User | null;

    @ManyToOne(() => User, (user) => user.assignedTasks, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'assignee_id' })
    assignee: User | null;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'deleted_by_id' })
    deletedBy: User | null;

    @OneToMany(() => SubTask, (subTask) => subTask.task)
    subTasks: SubTask[];

    @OneToMany(() => Comment, (comment) => comment.task)
    comments: Comment[];

    @OneToMany(() => Attachment, (attachment) => attachment.task)
    attachments: Attachment[];

    @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.task)
    timeEntries: TimeEntry[];

    @ManyToMany(() => Label, (label) => label.tasks)
    @JoinTable({
        name: 'task_labels',
        joinColumn: { name: 'task_id' },
        inverseJoinColumn: { name: 'label_id' },
    })
    labels: Label[];
}
