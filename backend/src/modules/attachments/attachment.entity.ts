import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { Task } from '@modules/tasks/task.entity';
import { User } from '@modules/users/user.entity';

@Entity('attachments')
@Index('IDX_attachments_task_id', ['taskId'])
@Index('IDX_attachments_uploader_id', ['uploaderId'])
export class Attachment extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @Column({ name: 'uploader_id', type: 'uuid', nullable: true })
    uploaderId: string | null;

    @Column({ name: 'file_name', type: 'varchar', length: 255 })
    fileName: string;

    @Column({ name: 'file_url', type: 'varchar', length: 1024 })
    fileUrl: string;

    @Column({ name: 'file_type', type: 'varchar', length: 50 })
    fileType: string;

    @Column({ name: 'file_size', type: 'integer' })
    fileSize: number;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Task, (task) => task.attachments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'uploader_id' })
    uploader: User | null;
}
