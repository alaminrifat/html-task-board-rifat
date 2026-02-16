import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { InvitationStatus } from '@shared/enums';
import { Project } from '@modules/projects/project.entity';
import { User } from '@modules/users/user.entity';

@Entity('invitations')
@Index('IDX_invitations_token', ['token'], { unique: true })
@Index('IDX_invitations_project_id', ['projectId'])
@Index('IDX_invitations_email', ['email'])
@Index('IDX_invitations_status', ['status'])
export class Invitation extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @Column({ name: 'inviter_id', type: 'uuid' })
    inviterId: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    email: string;

    @Column({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING,
    })
    status: InvitationStatus;

    @Column({ type: 'varchar', length: 255, unique: true })
    token: string;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    // ─── Relations ───────────────────────────────────────────────

    @ManyToOne(() => Project, (project) => project.invitations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inviter_id' })
    inviter: User;
}
