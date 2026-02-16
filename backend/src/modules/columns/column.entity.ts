import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { Project } from '@modules/projects/project.entity';
import { Task } from '@modules/tasks/task.entity';

@Entity('columns')
@Unique('UQ_columns_project_position', ['projectId', 'position'])
@Index('IDX_columns_project_id', ['projectId'])
export class BoardColumn extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    title: string;

    @Column({ type: 'integer', default: 0 })
    position: number;

    @Column({ name: 'wip_limit', type: 'integer', nullable: true })
    wipLimit: number | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.columns, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @OneToMany(() => Task, (task) => task.column)
    tasks: Task[];
}
