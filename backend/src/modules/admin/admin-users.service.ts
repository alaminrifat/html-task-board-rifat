import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    UnprocessableEntityException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { User } from '@modules/users/user.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Task } from '@modules/tasks/task.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { PasswordResetToken } from '@modules/auth/entities/password-reset-token.entity';
import { Project } from '@modules/projects/project.entity';
import { UserRole, UserStatus, ProjectStatus } from '@shared/enums';

import {
    AdminUserFilterDto,
    CreateAdminUserDto,
    UpdateAdminUserDto,
    ChangeUserStatusDto,
    ChangeUserRoleDto,
    BulkUserActionDto,
    BulkAction,
    AdminExportFilterDto,
} from './dtos';

// ── Sort field mapping ─────────────────────────────────────────────────
const SORT_FIELD_MAP: Record<string, string> = {
    full_name: 'user.fullName',
    email: 'user.email',
    role: 'user.role',
    status: 'user.status',
    created_at: 'user.createdAt',
    last_active_at: 'user.lastActiveAt',
};

@Injectable()
export class AdminUsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepo: Repository<RefreshToken>,
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepo: Repository<TimeEntry>,
        @InjectRepository(PasswordResetToken)
        private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        private readonly dataSource: DataSource,
    ) {}

    // ═══════════════════════════════════════════════════════════════════════
    // 1. GET /admin/users — List users with search, filter, sort, pagination
    // ═══════════════════════════════════════════════════════════════════════

    async listUsers(
        filters: AdminUserFilterDto,
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const offset = (page - 1) * limit;

        const qb = this.userRepo.createQueryBuilder('user');

        // Soft-deleted users only shown when status=DELETED
        if (filters.status === UserStatus.DELETED) {
            qb.withDeleted().andWhere('user.deletedAt IS NOT NULL');
        } else {
            // Default: exclude soft-deleted
            if (filters.status) {
                qb.andWhere('user.status = :status', {
                    status: filters.status,
                });
            }
        }

        // Search: ILIKE on fullName and email
        if (filters.search) {
            qb.andWhere(
                new Brackets((sub) => {
                    sub.where('user.fullName ILIKE :search', {
                        search: `%${filters.search}%`,
                    }).orWhere('user.email ILIKE :search', {
                        search: `%${filters.search}%`,
                    });
                }),
            );
        }

        // Role filter
        if (filters.role) {
            qb.andWhere('user.role = :role', { role: filters.role });
        }

        // Date range filter
        if (filters.dateFrom) {
            qb.andWhere('user.createdAt >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            qb.andWhere('user.createdAt <= :dateTo', {
                dateTo: `${filters.dateTo}T23:59:59.999Z`,
            });
        }

        // Subquery: projects count
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(pm.id)')
                .from(ProjectMember, 'pm')
                .where('pm.userId = user.id');
        }, 'projectsCount');

        // Subquery: tasks count (non-deleted tasks assigned to user)
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(t.id)')
                .from(Task, 't')
                .where('t.assigneeId = user.id')
                .andWhere('t.deletedAt IS NULL');
        }, 'tasksCount');

        // Sorting
        const sortField =
            SORT_FIELD_MAP[filters.sortBy ?? 'created_at'] ?? 'user.createdAt';
        const sortOrder = filters.sortOrder ?? 'DESC';
        qb.orderBy(sortField, sortOrder);

        // Get total count
        const total = await qb.getCount();

        // Pagination
        qb.offset(offset).limit(limit);

        const { entities, raw } = await qb.getRawAndEntities();

        const data = entities.map((user, index) => ({
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            status: user.deletedAt ? UserStatus.DELETED : user.status,
            avatarUrl: user.avatarUrl,
            projectsCount: parseInt(raw[index]?.projectsCount ?? '0', 10),
            tasksCount: parseInt(raw[index]?.tasksCount ?? '0', 10),
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
        }));

        return { data, total, page, limit };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. POST /admin/users — Create user from admin panel
    // ═══════════════════════════════════════════════════════════════════════

    async createUser(dto: CreateAdminUserDto): Promise<any> {
        // Check for existing email
        const existing = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase() },
            withDeleted: true,
        });
        if (existing) {
            throw new ConflictException(
                'A user with this email already exists',
            );
        }

        // Generate random password
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const user = this.userRepo.create({
            fullName: dto.name,
            email: dto.email.toLowerCase(),
            password: hashedPassword,
            role: dto.role,
            status: UserStatus.ACTIVE,
            emailVerified: false,
        });

        const saved = await this.userRepo.save(user);

        return {
            id: saved.id,
            name: saved.fullName,
            email: saved.email,
            role: saved.role,
            status: saved.status,
            avatarUrl: saved.avatarUrl,
            createdAt: saved.createdAt,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. GET /admin/users/:id — Get detailed user profile with stats
    // ═══════════════════════════════════════════════════════════════════════

    async getUserDetail(id: string): Promise<any> {
        const user = await this.userRepo.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Get user's projects via project_members
        const projectMembers = await this.memberRepo
            .createQueryBuilder('pm')
            .leftJoinAndSelect('pm.project', 'project')
            .where('pm.userId = :userId', { userId: id })
            .getMany();

        const projects = projectMembers.map((pm) => ({
            id: pm.project.id,
            title: pm.project.title,
            role: pm.projectRole,
            status: pm.project.status,
        }));

        // Get 5 most recent tasks assigned to user
        const recentTasks = await this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.column', 'column')
            .where('task.assigneeId = :userId', { userId: id })
            .andWhere('task.deletedAt IS NULL')
            .orderBy('task.createdAt', 'DESC')
            .limit(5)
            .getMany();

        // Stats
        const projectsCount = await this.memberRepo.count({
            where: { userId: id },
        });

        const tasksAssigned = await this.taskRepo
            .createQueryBuilder('task')
            .where('task.assigneeId = :userId', { userId: id })
            .andWhere('task.deletedAt IS NULL')
            .getCount();

        // Tasks completed: tasks in a column titled "Done" (common convention)
        const tasksCompleted = await this.taskRepo
            .createQueryBuilder('task')
            .innerJoin('task.column', 'column')
            .where('task.assigneeId = :userId', { userId: id })
            .andWhere('task.deletedAt IS NULL')
            .andWhere('LOWER(column.title) = :done', { done: 'done' })
            .getCount();

        // Total time logged (minutes)
        const timeResult = await this.timeEntryRepo
            .createQueryBuilder('te')
            .select('COALESCE(SUM(te.durationMinutes), 0)', 'total')
            .where('te.userId = :userId', { userId: id })
            .getRawOne();

        const totalTimeLoggedMinutes = parseInt(timeResult?.total ?? '0', 10);

        return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            status: user.deletedAt ? UserStatus.DELETED : user.status,
            avatarUrl: user.avatarUrl,
            jobTitle: user.jobTitle,
            emailVerified: user.emailVerified,
            lastActiveAt: user.lastActiveAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            projects,
            recentTasks: recentTasks.map((t) => ({
                id: t.id,
                title: t.title,
                projectTitle: t.project?.title,
                columnTitle: t.column?.title,
                priority: t.priority,
                dueDate: t.dueDate,
                createdAt: t.createdAt,
            })),
            stats: {
                projectsCount,
                tasksAssigned,
                tasksCompleted,
                totalTimeLoggedMinutes,
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. PATCH /admin/users/:id — Update user profile
    // ═══════════════════════════════════════════════════════════════════════

    async updateUser(id: string, dto: UpdateAdminUserDto): Promise<any> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (dto.name !== undefined) {
            user.fullName = dto.name;
        }
        if (dto.jobTitle !== undefined) {
            user.jobTitle = dto.jobTitle;
        }
        if (dto.avatarUrl !== undefined) {
            user.avatarUrl = dto.avatarUrl;
        }

        const saved = await this.userRepo.save(user);

        return {
            id: saved.id,
            name: saved.fullName,
            email: saved.email,
            role: saved.role,
            status: saved.status,
            avatarUrl: saved.avatarUrl,
            jobTitle: saved.jobTitle,
            updatedAt: saved.updatedAt,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. PATCH /admin/users/:id/status — Change status (active/suspended)
    // ═══════════════════════════════════════════════════════════════════════

    async changeStatus(
        adminId: string,
        userId: string,
        dto: ChangeUserStatusDto,
    ): Promise<any> {
        if (adminId === userId) {
            throw new ForbiddenException('You cannot change your own status');
        }

        const user = await this.userRepo.findOne({
            where: { id: userId },
            withDeleted: true,
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (user.deletedAt) {
            throw new UnprocessableEntityException(
                'Cannot change status of a deleted user',
            );
        }

        user.status = dto.status;
        const saved = await this.userRepo.save(user);

        // If suspending, revoke all refresh tokens
        if (dto.status === UserStatus.SUSPENDED) {
            await this.refreshTokenRepo.delete({ userId });
        }

        return {
            id: saved.id,
            name: saved.fullName,
            email: saved.email,
            role: saved.role,
            status: saved.status,
            updatedAt: saved.updatedAt,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. PATCH /admin/users/:id/role — Change user role
    // ═══════════════════════════════════════════════════════════════════════

    async changeRole(
        adminId: string,
        userId: string,
        dto: ChangeUserRoleDto,
    ): Promise<any> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Cannot change an admin's role
        if (user.role === UserRole.ADMIN) {
            throw new ForbiddenException(
                'Cannot change the role of an admin user',
            );
        }

        // DTO validation already ensures role is not ADMIN,
        // but add an extra safety check
        if ((dto.role as string) === UserRole.ADMIN) {
            throw new BadRequestException('Cannot promote a user to admin');
        }

        user.role = dto.role;
        const saved = await this.userRepo.save(user);

        return {
            id: saved.id,
            name: saved.fullName,
            email: saved.email,
            role: saved.role,
            status: saved.status,
            updatedAt: saved.updatedAt,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. POST /admin/users/:id/reset-password — Admin-initiated password reset
    // ═══════════════════════════════════════════════════════════════════════

    async resetPassword(userId: string): Promise<{ message: string }> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            withDeleted: true,
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (user.deletedAt) {
            throw new UnprocessableEntityException(
                'Cannot reset password for a deleted user',
            );
        }

        // Mark all existing password reset tokens as used
        await this.passwordResetTokenRepo
            .createQueryBuilder()
            .update(PasswordResetToken)
            .set({ isUsed: true })
            .where('userId = :userId', { userId })
            .andWhere('isUsed = :isUsed', { isUsed: false })
            .execute();

        // Create a new password reset token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        const resetToken = this.passwordResetTokenRepo.create({
            userId,
            tokenHash,
            isUsed: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        await this.passwordResetTokenRepo.save(resetToken);

        // In a real implementation, an email would be sent here with the rawToken
        return { message: 'Password reset initiated successfully' };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. DELETE /admin/users/:id — Soft-delete user
    // ═══════════════════════════════════════════════════════════════════════

    async deleteUser(adminId: string, userId: string): Promise<void> {
        if (adminId === userId) {
            throw new ForbiddenException('You cannot delete your own account');
        }

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Cannot delete another admin
        if (user.role === UserRole.ADMIN) {
            throw new ForbiddenException('Cannot delete another admin user');
        }

        // Check if user owns active projects with other members
        const ownedActiveProjects = await this.projectRepo
            .createQueryBuilder('project')
            .where('project.ownerId = :userId', { userId })
            .andWhere('project.status = :status', {
                status: ProjectStatus.ACTIVE,
            })
            .andWhere('project.deletedAt IS NULL')
            .getMany();

        for (const project of ownedActiveProjects) {
            const memberCount = await this.memberRepo.count({
                where: { projectId: project.id },
            });

            if (memberCount > 1) {
                // Has other members — cannot auto-archive
                throw new UnprocessableEntityException(
                    `User owns active project "${project.title}" with other members. Please archive or transfer ownership first.`,
                );
            }

            // Sole owner with no other members — auto-archive
            await this.projectRepo.update(project.id, {
                status: ProjectStatus.ARCHIVED,
            });
        }

        // Run cleanup in a transaction
        await this.dataSource.transaction(async (manager) => {
            // Remove project memberships
            await manager.delete(ProjectMember, { userId });

            // Nullify task assignee_id
            await manager
                .createQueryBuilder()
                .update(Task)
                .set({ assigneeId: null })
                .where('assigneeId = :userId', { userId })
                .execute();

            // Delete refresh tokens
            await manager.delete(RefreshToken, { userId });

            // Soft-delete user
            await manager.softDelete(User, userId);

            // Set status to DELETED
            await manager.update(User, userId, { status: UserStatus.DELETED });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 9. POST /admin/users/bulk — Bulk action on multiple users
    // ═══════════════════════════════════════════════════════════════════════

    async bulkAction(
        adminId: string,
        dto: BulkUserActionDto,
    ): Promise<{
        success: number;
        failed: number;
        errors: Array<{ userId: string; message: string }>;
    }> {
        let success = 0;
        let failed = 0;
        const errors: Array<{ userId: string; message: string }> = [];

        for (const userId of dto.userIds) {
            try {
                switch (dto.action) {
                    case BulkAction.ACTIVATE:
                        await this.changeStatus(adminId, userId, {
                            status: UserStatus.ACTIVE,
                        });
                        break;
                    case BulkAction.SUSPEND:
                        await this.changeStatus(adminId, userId, {
                            status: UserStatus.SUSPENDED,
                        });
                        break;
                    case BulkAction.DELETE:
                        await this.deleteUser(adminId, userId);
                        break;
                }
                success++;
            } catch (error: any) {
                failed++;
                errors.push({
                    userId,
                    message: error.message || 'Unknown error',
                });
            }
        }

        return { success, failed, errors };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 10. GET /admin/users/export — Export users as CSV
    // ═══════════════════════════════════════════════════════════════════════

    async exportUsersCsv(filters: AdminExportFilterDto): Promise<string> {
        const qb = this.userRepo.createQueryBuilder('user');

        // Apply filters (same as list but no pagination)
        if (filters.status === UserStatus.DELETED) {
            qb.withDeleted().andWhere('user.deletedAt IS NOT NULL');
        } else if (filters.status) {
            qb.andWhere('user.status = :status', { status: filters.status });
        }

        if (filters.search) {
            qb.andWhere(
                new Brackets((sub) => {
                    sub.where('user.fullName ILIKE :search', {
                        search: `%${filters.search}%`,
                    }).orWhere('user.email ILIKE :search', {
                        search: `%${filters.search}%`,
                    });
                }),
            );
        }

        if (filters.role) {
            qb.andWhere('user.role = :role', { role: filters.role });
        }

        if (filters.dateFrom) {
            qb.andWhere('user.createdAt >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }
        if (filters.dateTo) {
            qb.andWhere('user.createdAt <= :dateTo', {
                dateTo: `${filters.dateTo}T23:59:59.999Z`,
            });
        }

        // Subquery counts
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(pm.id)')
                .from(ProjectMember, 'pm')
                .where('pm.userId = user.id');
        }, 'projectsCount');

        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(t.id)')
                .from(Task, 't')
                .where('t.assigneeId = user.id')
                .andWhere('t.deletedAt IS NULL');
        }, 'tasksCount');

        qb.orderBy('user.createdAt', 'DESC');

        // Check total count to enforce 10,000 limit
        const total = await qb.getCount();
        if (total > 10000) {
            throw new UnprocessableEntityException(
                `Export limit exceeded: ${total} rows found. Maximum 10,000 rows allowed. Please narrow your filters.`,
            );
        }

        const { entities, raw } = await qb.getRawAndEntities();

        // Build CSV
        const header =
            'Name,Email,Role,Status,Job Title,Projects Count,Tasks Count,Registration Date,Last Active';
        const rows = entities.map((user, index) => {
            const projectsCount = parseInt(
                raw[index]?.projectsCount ?? '0',
                10,
            );
            const tasksCount = parseInt(raw[index]?.tasksCount ?? '0', 10);
            const status = user.deletedAt ? UserStatus.DELETED : user.status;
            const registrationDate = user.createdAt
                ? new Date(user.createdAt).toISOString().split('T')[0]
                : '';
            const lastActive = user.lastActiveAt
                ? new Date(user.lastActiveAt).toISOString().split('T')[0]
                : '';

            return [
                this.escapeCsvField(user.fullName ?? ''),
                this.escapeCsvField(user.email ?? ''),
                user.role,
                status,
                this.escapeCsvField(user.jobTitle ?? ''),
                projectsCount,
                tasksCount,
                registrationDate,
                lastActive,
            ].join(',');
        });

        return [header, ...rows].join('\n');
    }

    // ── Private Helpers ─────────────────────────────────────────────────

    private escapeCsvField(value: string): string {
        if (
            value.includes(',') ||
            value.includes('"') ||
            value.includes('\n')
        ) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
