import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { UserRole, UserStatus, DigestFrequency } from '@shared/enums';

import type { Project } from '@modules/projects/project.entity';
import type { ProjectMember } from '@modules/project-members/project-member.entity';
import type { Task } from '@modules/tasks/task.entity';
import type { Comment } from '@modules/comments/comment.entity';
import type { Notification } from '@modules/notifications/notification.entity';
import type { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import type { UserDevice } from '@modules/users/entities/user-device.entity';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;

    @Column({ nullable: true, select: false })
    password?: string;

    @Column({ name: 'first_name', nullable: true })
    firstName?: string;

    @Column({ name: 'last_name', nullable: true })
    lastName?: string;

    @Column({ name: 'full_name', nullable: true })
    fullName: string;

    @Index('IDX_users_role')
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.TEAM_MEMBER,
    })
    role: UserRole;

    @Index('IDX_users_status')
    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column({
        type: 'jsonb',
        nullable: true,
        default: () => "'[]'",
        name: 'device_fcm_tokens',
    })
    deviceFcmTokens: string[];

    @Column({
        name: 'refresh_token',
        nullable: true,
        select: false,
        type: 'text',
    })
    refreshToken: string | null;

    @Column({ default: false, nullable: true })
    rememberMe: boolean;

    // ── New columns ──────────────────────────────────────────────────────

    @Column({ name: 'job_title', type: 'varchar', length: 255, nullable: true })
    jobTitle?: string;

    @Column({
        name: 'profile_photo_url',
        type: 'varchar',
        length: 512,
        nullable: true,
    })
    avatarUrl?: string;

    @Index('IDX_users_google_id', { unique: true })
    @Column({
        name: 'google_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    })
    googleId?: string;

    @Column({ name: 'push_enabled', type: 'boolean', default: true })
    pushEnabled: boolean;

    @Column({
        name: 'digest_frequency',
        type: 'enum',
        enum: DigestFrequency,
        default: DigestFrequency.OFF,
    })
    digestFrequency: DigestFrequency;

    @Column({ name: 'notify_task_assigned', type: 'boolean', default: true })
    notifyTaskAssigned: boolean;

    @Column({
        name: 'notify_due_date_reminder',
        type: 'boolean',
        default: true,
    })
    notifyDueDateReminder: boolean;

    @Column({ name: 'notify_status_change', type: 'boolean', default: true })
    notifyStatusChange: boolean;

    @Column({ name: 'notify_comment_mention', type: 'boolean', default: true })
    notifyCommentMention: boolean;

    @Column({ name: 'notify_new_comment', type: 'boolean', default: true })
    notifyNewComment: boolean;

    @Column({ name: 'notify_invitation', type: 'boolean', default: true })
    notifyInvitation: boolean;

    @Column({
        name: 'notify_project_created',
        type: 'boolean',
        default: true,
    })
    notifyProjectCreated: boolean;

    @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
    lastActiveAt?: Date;

    // ── Relations ────────────────────────────────────────────────────────

    @OneToMany('Project', 'owner')
    projects: Project[];

    @OneToMany('ProjectMember', 'user')
    projectMembers: ProjectMember[];

    @OneToMany('Task', 'assignee')
    assignedTasks: Task[];

    @OneToMany('Task', 'creator')
    createdTasks: Task[];

    @OneToMany('Comment', 'user')
    comments: Comment[];

    @OneToMany('Notification', 'user')
    notifications: Notification[];

    @OneToMany('RefreshToken', 'user')
    refreshTokens: RefreshToken[];

    @OneToMany('UserDevice', 'user')
    userDevices: UserDevice[];
}
