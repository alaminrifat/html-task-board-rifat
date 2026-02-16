import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';

import type { User } from '@modules/users/user.entity';

@Index('IDX_email_verification_tokens_token_hash', ['tokenHash'])
@Index('IDX_email_verification_tokens_user_id', ['userId'])
@Index('IDX_email_verification_tokens_expires_at', ['expiresAt'])
@Entity('email_verification_tokens')
export class EmailVerificationToken extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'token_hash', type: 'varchar', length: 255 })
    tokenHash: string;

    @Column({ name: 'is_used', type: 'boolean', default: false })
    isUsed: boolean;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    // ── Relations ────────────────────────────────────────────────────────

    @ManyToOne('User', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
