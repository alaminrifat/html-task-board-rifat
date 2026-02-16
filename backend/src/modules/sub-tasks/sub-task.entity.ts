import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { Task } from '@modules/tasks/task.entity';

@Entity('sub_tasks')
@Index('IDX_sub_tasks_task_id', ['taskId'])
@Index('IDX_sub_tasks_task_position', ['taskId', 'position'])
export class SubTask extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @Column({ type: 'varchar', length: 500, nullable: false })
    title: string;

    @Column({ name: 'is_completed', type: 'boolean', default: false })
    isCompleted: boolean;

    @Column({ type: 'integer', default: 0 })
    position: number;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Task, (task) => task.subTasks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task;
}
