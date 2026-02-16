import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { Label } from '@modules/labels/label.entity';
import { UpdateGeneralSettingsDto } from './dtos/update-general-settings.dto';
import { UpdateNotificationSettingsDto } from './dtos/update-notification-settings.dto';
import { CreateAdminLabelDto } from './dtos/create-admin-label.dto';
import { UpdateAdminLabelDto } from './dtos/update-admin-label.dto';

@Injectable()
export class AdminSettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private readonly settingRepository: Repository<SystemSetting>,
        @InjectRepository(Label)
        private readonly labelRepository: Repository<Label>,
    ) {}

    // ─── System Settings ──────────────────────────────────────────────

    /**
     * Get all system settings with updatedBy user info.
     */
    async getAllSettings(): Promise<SystemSetting[]> {
        return this.settingRepository.find({
            relations: { updatedBy: true },
            order: { key: 'ASC' },
        });
    }

    /**
     * Update general settings (app_name, default_template_columns, max_file_upload_size, allowed_file_types).
     * Each field maps to a separate system_settings row keyed by its snake_case name.
     */
    async updateGeneralSettings(
        adminId: string,
        dto: UpdateGeneralSettingsDto,
    ): Promise<SystemSetting[]> {
        const fieldMapping: Record<
            string,
            { key: string; description: string }
        > = {
            appName: {
                key: 'app_name',
                description: 'Application display name',
            },
            defaultTemplateColumns: {
                key: 'default_template_columns',
                description: 'Default columns for new board templates',
            },
            maxFileUploadSize: {
                key: 'max_file_upload_size',
                description: 'Maximum file upload size in bytes',
            },
            allowedFileTypes: {
                key: 'allowed_file_types',
                description: 'Allowed MIME types for file uploads',
            },
        };

        const updates = Object.entries(dto).filter(
            ([, value]) => value !== undefined,
        );

        if (updates.length === 0) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        for (const [field, value] of updates) {
            const mapping = fieldMapping[field];
            if (mapping) {
                await this.upsertSetting(
                    mapping.key,
                    value,
                    mapping.description,
                    adminId,
                );
            }
        }

        return this.getAllSettings();
    }

    /**
     * Update notification settings (global_email_enabled, default_digest_frequency, deadline_reminder_hours).
     */
    async updateNotificationSettings(
        adminId: string,
        dto: UpdateNotificationSettingsDto,
    ): Promise<SystemSetting[]> {
        const fieldMapping: Record<
            string,
            { key: string; description: string }
        > = {
            globalEmailEnabled: {
                key: 'global_email_enabled',
                description: 'Whether global email notifications are enabled',
            },
            defaultDigestFrequency: {
                key: 'default_digest_frequency',
                description: 'Default digest frequency for new users',
            },
            deadlineReminderHours: {
                key: 'deadline_reminder_hours',
                description: 'Hours before deadline to send reminder',
            },
        };

        const updates = Object.entries(dto).filter(
            ([, value]) => value !== undefined,
        );

        if (updates.length === 0) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        for (const [field, value] of updates) {
            const mapping = fieldMapping[field];
            if (mapping) {
                await this.upsertSetting(
                    mapping.key,
                    value,
                    mapping.description,
                    adminId,
                );
            }
        }

        return this.getAllSettings();
    }

    // ─── Global Default Labels ────────────────────────────────────────

    /**
     * List all global default labels (projectId IS NULL), sorted by name.
     */
    async getGlobalLabels(): Promise<Label[]> {
        return this.labelRepository.find({
            where: { projectId: IsNull() as any },
            order: { name: 'ASC' },
        });
    }

    /**
     * Create a new global default label (projectId = NULL).
     * Throws 409 if a global label with the same name already exists.
     */
    async createGlobalLabel(dto: CreateAdminLabelDto): Promise<Label> {
        await this.checkDuplicateGlobalLabelName(dto.name);

        const label = this.labelRepository.create({
            projectId: null,
            name: dto.name,
            color: dto.color,
        });

        return this.labelRepository.save(label);
    }

    /**
     * Update a global default label.
     * Only labels with projectId IS NULL can be updated here.
     * Throws 404 if label not found or is project-scoped.
     * Throws 409 if duplicate name among global labels.
     */
    async updateGlobalLabel(
        labelId: string,
        dto: UpdateAdminLabelDto,
    ): Promise<Label> {
        if (dto.name === undefined && dto.color === undefined) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        const label = await this.findGlobalLabelOrFail(labelId);

        if (dto.name !== undefined && dto.name !== label.name) {
            await this.checkDuplicateGlobalLabelName(dto.name, labelId);
        }

        if (dto.name !== undefined) {
            label.name = dto.name;
        }
        if (dto.color !== undefined) {
            label.color = dto.color;
        }

        return this.labelRepository.save(label);
    }

    /**
     * Delete a global default label (hard delete).
     * Only labels with projectId IS NULL can be deleted here.
     */
    async deleteGlobalLabel(labelId: string): Promise<void> {
        const label = await this.findGlobalLabelOrFail(labelId);
        await this.labelRepository.remove(label);
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    /**
     * Upsert a system setting: find by key, update if exists, create if not.
     * The value is stored as JSONB: { value: <actualValue> }
     */
    private async upsertSetting(
        key: string,
        value: unknown,
        description: string,
        adminId: string,
    ): Promise<SystemSetting> {
        let setting = await this.settingRepository.findOne({ where: { key } });

        if (setting) {
            setting.value = { value };
            setting.description = description;
            setting.updatedById = adminId;
            return this.settingRepository.save(setting);
        }

        setting = this.settingRepository.create({
            key,
            value: { value },
            description,
            updatedById: adminId,
        });
        return this.settingRepository.save(setting);
    }

    /**
     * Find a global label (projectId IS NULL) by ID or throw 404.
     */
    private async findGlobalLabelOrFail(labelId: string): Promise<Label> {
        const label = await this.labelRepository.findOne({
            where: { id: labelId },
        });

        if (!label) {
            throw new NotFoundException(`Label with ID ${labelId} not found`);
        }

        if (label.projectId !== null) {
            throw new NotFoundException(
                `Label with ID ${labelId} is a project-scoped label, not a global label`,
            );
        }

        return label;
    }

    /**
     * Check that no other global label (projectId IS NULL) has the same name.
     * Optionally exclude a specific label ID (for updates).
     */
    private async checkDuplicateGlobalLabelName(
        name: string,
        excludeId?: string,
    ): Promise<void> {
        const existing = await this.labelRepository.findOne({
            where: {
                projectId: IsNull() as any,
                name,
            },
        });

        if (existing && existing.id !== excludeId) {
            throw new ConflictException(
                `A global label with the name "${name}" already exists`,
            );
        }
    }
}
