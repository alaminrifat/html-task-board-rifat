import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { User } from '@modules/users/user.entity';

@Entity('system_settings')
@Index('IDX_system_settings_key', ['key'], { unique: true })
export class SystemSetting extends BaseEntity {
    @Column({ type: 'varchar', length: 100, unique: true })
    key: string;

    @Column({ type: 'jsonb', nullable: false })
    value: Record<string, unknown>;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    @Column({ name: 'updated_by_id', type: 'uuid', nullable: true })
    updatedById: string | null;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by_id' })
    updatedBy: User | null;
}
