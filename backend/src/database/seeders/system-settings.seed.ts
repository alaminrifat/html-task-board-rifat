import { DataSource } from 'typeorm';
import { SystemSetting } from 'src/modules/admin/entities/system-setting.entity';

export async function seedSystemSettings(
    dataSource: DataSource,
): Promise<void> {
    const settingsRepository = dataSource.getRepository(SystemSetting);

    const existingSettings = await settingsRepository.count();
    if (existingSettings > 0) {
        console.log(
            `${existingSettings} system setting(s) already exist in database`,
        );
        return;
    }

    console.log('Creating default system settings...');

    const settings: Partial<SystemSetting>[] = [
        {
            key: 'app_name',
            value: { value: 'TaskBoard' },
            description: 'Application display name',
        },
        {
            key: 'default_project_template',
            value: { value: 'DEFAULT' },
            description:
                'Default board template for new projects (DEFAULT or MINIMAL)',
        },
        {
            key: 'max_file_upload_size_mb',
            value: { value: 10 },
            description: 'Maximum file upload size in megabytes',
        },
        {
            key: 'invitation_expiry_days',
            value: { value: 7 },
            description: 'Number of days before project invitations expire',
        },
        {
            key: 'trash_auto_delete_days',
            value: { value: 30 },
            description:
                'Number of days before trashed tasks are permanently deleted',
        },
        {
            key: 'deadline_reminder_hours',
            value: { value: 24 },
            description: 'Hours before deadline to send reminder notifications',
        },
        {
            key: 'max_resend_invitations',
            value: { value: 3 },
            description: 'Maximum number of invitation resend attempts',
        },
    ];

    for (const setting of settings) {
        const entity = settingsRepository.create(setting);
        await settingsRepository.save(entity);
    }

    console.log(`Successfully created ${settings.length} system settings`);
}
