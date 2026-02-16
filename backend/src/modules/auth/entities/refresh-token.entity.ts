import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';

import type { User } from '@modules/users/user.entity';

@Index('IDX_refresh_tokens_token', ['token'], { unique: true })
@Index('IDX_refresh_tokens_user_id', ['userId'])
@Index('IDX_refresh_tokens_expires_at', ['expiresAt'])
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ type: 'varchar', length: 512, unique: true })
    token: string;

    @Column({
        name: 'user_agent',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    userAgent?: string;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    // ── Relations ────────────────────────────────────────────────────────

    @ManyToOne('User', 'refreshTokens', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
