import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { TimeEntryType } from '@shared/enums';
import { Task } from '@modules/tasks/task.entity';
import { User } from '@modules/users/user.entity';

@Entity('time_entries')
@Index('IDX_time_entries_task_id', ['taskId'])
@Index('IDX_time_entries_user_id', ['userId'])
@Index('IDX_time_entries_created_at', ['createdAt'])
export class TimeEntry extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({
        name: 'entry_type',
        type: 'enum',
        enum: TimeEntryType,
    })
    entryType: TimeEntryType;

    @Column({ name: 'duration_minutes', type: 'integer' })
    durationMinutes: number;

    @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
    startedAt: Date | null;

    @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
    endedAt: Date | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Task, (task) => task.timeEntries, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
