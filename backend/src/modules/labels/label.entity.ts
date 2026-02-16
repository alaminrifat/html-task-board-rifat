import {
    Entity,
    Column,
    ManyToOne,
    ManyToMany,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';

@Entity('labels')
@Unique('UQ_labels_project_name', ['projectId', 'name'])
@Index('IDX_labels_project_id', ['projectId'])
export class Label extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid', nullable: true })
    projectId: string | null;

    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 7, nullable: false })
    color: string;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.labels, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project | null;

    @ManyToMany(() => Task, (task) => task.labels)
    tasks: Task[];
}
