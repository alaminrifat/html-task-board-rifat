import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';

import type { User } from '@modules/users/user.entity';

@Index('IDX_user_devices_token', ['token'], { unique: true })
@Index('IDX_user_devices_user_id', ['userId'])
@Entity('user_devices')
export class UserDevice extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ type: 'varchar', length: 500, unique: true })
    token: string;

    @Column({ type: 'varchar', length: 10 })
    platform: string;

    @Column({
        name: 'device_name',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    deviceName?: string;

    // ── Relations ────────────────────────────────────────────────────────

    @ManyToOne('User', 'userDevices', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
