import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';

import { AdminSettingsService } from './admin-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { Label } from '@modules/labels/label.entity';
import { DigestFrequency } from '@shared/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRepository() {
    return {
        findOne: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        create: jest
            .fn()
            .mockImplementation((data) => ({ ...data, id: 'new-id' })),
        save: jest
            .fn()
            .mockImplementation((entity) =>
                Promise.resolve({ ...entity, id: entity.id ?? 'new-id' }),
            ),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        remove: jest
            .fn()
            .mockImplementation((entity) => Promise.resolve(entity)),
        count: jest.fn().mockResolvedValue(0),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AdminSettingsService', () => {
    let service: AdminSettingsService;
    let settingRepo: ReturnType<typeof mockRepository>;
    let labelRepo: ReturnType<typeof mockRepository>;

    beforeEach(async () => {
        settingRepo = mockRepository();
        labelRepo = mockRepository();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminSettingsService,
                {
                    provide: getRepositoryToken(SystemSetting),
                    useValue: settingRepo,
                },
                { provide: getRepositoryToken(Label), useValue: labelRepo },
            ],
        }).compile();

        service = module.get<AdminSettingsService>(AdminSettingsService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getAllSettings
    // ═══════════════════════════════════════════════════════════════════════

    describe('getAllSettings', () => {
        it('should return all settings with updatedBy user info', async () => {
            const settings = [
                {
                    id: 's1',
                    key: 'app_name',
                    value: { value: 'TaskBoard' },
                    description: 'App name',
                    updatedBy: { id: 'u1', fullName: 'Admin' },
                },
                {
                    id: 's2',
                    key: 'max_file_upload_size',
                    value: { value: 10485760 },
                    description: 'Max upload size',
                    updatedBy: null,
                },
            ];
            settingRepo.find.mockResolvedValue(settings);

            const result = await service.getAllSettings();

            expect(result).toHaveLength(2);
            expect(settingRepo.find).toHaveBeenCalledWith({
                relations: { updatedBy: true },
                order: { key: 'ASC' },
            });
        });

        it('should return empty array when no settings exist', async () => {
            settingRepo.find.mockResolvedValue([]);

            const result = await service.getAllSettings();

            expect(result).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateGeneralSettings
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateGeneralSettings', () => {
        it('should update app_name setting', async () => {
            settingRepo.findOne.mockResolvedValue({
                id: 's1',
                key: 'app_name',
                value: { value: 'Old Name' },
                description: 'Application display name',
                updatedById: null,
            });
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateGeneralSettings('admin-id', {
                appName: 'New TaskBoard',
            });

            expect(settingRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: { value: 'New TaskBoard' },
                    updatedById: 'admin-id',
                }),
            );
        });

        it('should create new setting if it does not exist yet', async () => {
            settingRepo.findOne.mockResolvedValue(null); // setting does not exist
            settingRepo.create.mockImplementation((data) => ({
                ...data,
                id: 'new-setting-id',
            }));
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateGeneralSettings('admin-id', {
                appName: 'Brand New App',
            });

            expect(settingRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'app_name',
                    value: { value: 'Brand New App' },
                    updatedById: 'admin-id',
                }),
            );
        });

        it('should update multiple settings at once', async () => {
            settingRepo.findOne.mockResolvedValue(null);
            settingRepo.create.mockImplementation((data) => ({ ...data }));
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateGeneralSettings('admin-id', {
                appName: 'MyApp',
                maxFileUploadSize: 5242880,
            });

            expect(settingRepo.save).toHaveBeenCalledTimes(2);
        });

        it('should throw BadRequestException when no fields are provided', async () => {
            await expect(
                service.updateGeneralSettings('admin-id', {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('should update defaultTemplateColumns setting', async () => {
            settingRepo.findOne.mockResolvedValue(null);
            settingRepo.create.mockImplementation((data) => ({ ...data }));
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateGeneralSettings('admin-id', {
                defaultTemplateColumns: ['To Do', 'In Progress', 'Done'],
            });

            expect(settingRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'default_template_columns',
                    value: { value: ['To Do', 'In Progress', 'Done'] },
                }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateNotificationSettings
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateNotificationSettings', () => {
        it('should update globalEmailEnabled setting', async () => {
            settingRepo.findOne.mockResolvedValue(null);
            settingRepo.create.mockImplementation((data) => ({ ...data }));
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateNotificationSettings('admin-id', {
                globalEmailEnabled: false,
            });

            expect(settingRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'global_email_enabled',
                    value: { value: false },
                }),
            );
        });

        it('should update deadlineReminderHours setting', async () => {
            settingRepo.findOne.mockResolvedValue({
                id: 's1',
                key: 'deadline_reminder_hours',
                value: { value: 24 },
                description: 'Hours before deadline',
                updatedById: null,
            });
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateNotificationSettings('admin-id', {
                deadlineReminderHours: 48,
            });

            expect(settingRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: { value: 48 },
                    updatedById: 'admin-id',
                }),
            );
        });

        it('should throw BadRequestException when no fields are provided', async () => {
            await expect(
                service.updateNotificationSettings('admin-id', {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('should update defaultDigestFrequency setting', async () => {
            settingRepo.findOne.mockResolvedValue(null);
            settingRepo.create.mockImplementation((data) => ({ ...data }));
            settingRepo.save.mockImplementation((s) => Promise.resolve(s));
            settingRepo.find.mockResolvedValue([]);

            await service.updateNotificationSettings('admin-id', {
                defaultDigestFrequency: DigestFrequency.OFF,
            });

            expect(settingRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'default_digest_frequency',
                }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getGlobalLabels
    // ═══════════════════════════════════════════════════════════════════════

    describe('getGlobalLabels', () => {
        it('should return labels where projectId IS NULL sorted by name', async () => {
            const labels = [
                { id: 'l1', name: 'Bug', color: '#FF0000', projectId: null },
                {
                    id: 'l2',
                    name: 'Feature',
                    color: '#00FF00',
                    projectId: null,
                },
            ];
            labelRepo.find.mockResolvedValue(labels);

            const result = await service.getGlobalLabels();

            expect(result).toHaveLength(2);
            expect(labelRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { name: 'ASC' },
                }),
            );
        });

        it('should return empty array when no global labels exist', async () => {
            labelRepo.find.mockResolvedValue([]);

            const result = await service.getGlobalLabels();

            expect(result).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // createGlobalLabel
    // ═══════════════════════════════════════════════════════════════════════

    describe('createGlobalLabel', () => {
        it('should create a label with projectId = null', async () => {
            labelRepo.findOne.mockResolvedValue(null); // no duplicate
            labelRepo.create.mockReturnValue({
                id: 'new-label',
                name: 'Urgent',
                color: '#E53E3E',
                projectId: null,
            });
            labelRepo.save.mockResolvedValue({
                id: 'new-label',
                name: 'Urgent',
                color: '#E53E3E',
                projectId: null,
            });

            const result = await service.createGlobalLabel({
                name: 'Urgent',
                color: '#E53E3E',
            });

            expect(result.projectId).toBeNull();
            expect(result.name).toBe('Urgent');
            expect(labelRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId: null,
                }),
            );
        });

        it('should throw ConflictException if a global label with the same name exists', async () => {
            labelRepo.findOne.mockResolvedValue({
                id: 'existing',
                name: 'Bug',
                projectId: null,
            });

            await expect(
                service.createGlobalLabel({ name: 'Bug', color: '#FF0000' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateGlobalLabel
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateGlobalLabel', () => {
        it('should update label name and color', async () => {
            const existingLabel = {
                id: 'l1',
                name: 'Old Name',
                color: '#000000',
                projectId: null,
            };

            // First call: findGlobalLabelOrFail
            // Second call: checkDuplicateGlobalLabelName (returns null = no duplicate)
            labelRepo.findOne
                .mockResolvedValueOnce(existingLabel)
                .mockResolvedValueOnce(null);

            labelRepo.save.mockImplementation((l) => Promise.resolve(l));

            const result = await service.updateGlobalLabel('l1', {
                name: 'New Name',
                color: '#FFFFFF',
            });

            expect(result.name).toBe('New Name');
            expect(result.color).toBe('#FFFFFF');
        });

        it('should throw NotFoundException for non-existent label', async () => {
            labelRepo.findOne.mockResolvedValue(null);

            await expect(
                service.updateGlobalLabel('missing', { name: 'Test' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException for project-scoped label', async () => {
            const projectLabel = {
                id: 'l1',
                name: 'Project Label',
                color: '#000000',
                projectId: 'p1', // Not null -> project-scoped
            };
            labelRepo.findOne.mockResolvedValue(projectLabel);

            await expect(
                service.updateGlobalLabel('l1', { name: 'Updated' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when renaming to duplicate name', async () => {
            const existingLabel = {
                id: 'l1',
                name: 'Original',
                color: '#000000',
                projectId: null,
            };
            const duplicateLabel = {
                id: 'l2',
                name: 'Duplicate',
                color: '#111111',
                projectId: null,
            };

            labelRepo.findOne
                .mockResolvedValueOnce(existingLabel) // findGlobalLabelOrFail
                .mockResolvedValueOnce(duplicateLabel); // checkDuplicateGlobalLabelName - found!

            await expect(
                service.updateGlobalLabel('l1', { name: 'Duplicate' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException when no fields provided', async () => {
            await expect(service.updateGlobalLabel('l1', {})).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should allow updating only the color without name', async () => {
            const existingLabel = {
                id: 'l1',
                name: 'Keep Name',
                color: '#000000',
                projectId: null,
            };
            labelRepo.findOne.mockResolvedValue(existingLabel);
            labelRepo.save.mockImplementation((l) => Promise.resolve(l));

            const result = await service.updateGlobalLabel('l1', {
                color: '#FF0000',
            });

            expect(result.name).toBe('Keep Name');
            expect(result.color).toBe('#FF0000');
        });

        it('should skip duplicate check when name is unchanged', async () => {
            const existingLabel = {
                id: 'l1',
                name: 'Same Name',
                color: '#000000',
                projectId: null,
            };
            labelRepo.findOne.mockResolvedValue(existingLabel);
            labelRepo.save.mockImplementation((l) => Promise.resolve(l));

            await service.updateGlobalLabel('l1', {
                name: 'Same Name',
                color: '#FF0000',
            });

            // findOne should be called only once for findGlobalLabelOrFail
            // The duplicate check is skipped because name === label.name
            expect(labelRepo.findOne).toHaveBeenCalledTimes(1);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // deleteGlobalLabel
    // ═══════════════════════════════════════════════════════════════════════

    describe('deleteGlobalLabel', () => {
        it('should hard delete a global label', async () => {
            const label = {
                id: 'l1',
                name: 'To Delete',
                color: '#FF0000',
                projectId: null,
            };
            labelRepo.findOne.mockResolvedValue(label);

            await service.deleteGlobalLabel('l1');

            expect(labelRepo.remove).toHaveBeenCalledWith(label);
        });

        it('should throw NotFoundException for non-existent label', async () => {
            labelRepo.findOne.mockResolvedValue(null);

            await expect(service.deleteGlobalLabel('missing')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException for project-scoped label', async () => {
            const projectLabel = {
                id: 'l1',
                name: 'Project Label',
                color: '#000000',
                projectId: 'p1',
            };
            labelRepo.findOne.mockResolvedValue(projectLabel);

            await expect(service.deleteGlobalLabel('l1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
