import { httpService } from '~/services/httpService';
import type { AdminSettings, AdminLabel } from '~/types/admin';

/**
 * Backend GET /admin/settings returns SystemSetting[] — an array of
 * { key: string, value: { value: unknown }, description: string } rows.
 * We need to transform this into the AdminSettings shape the UI expects.
 */
interface SystemSettingRow {
  key: string;
  value: { value: unknown } | unknown;
  description?: string;
}

function transformSettingsArray(rows: SystemSettingRow[]): AdminSettings {
  const safeRows = Array.isArray(rows) ? rows : [];

  const getValue = (key: string): unknown => {
    const row = safeRows.find((r) => r?.key === key);
    if (!row) return undefined;
    // value is stored as { value: <actual> } in JSONB
    const v = row.value;
    if (v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
      return (v as Record<string, unknown>).value;
    }
    return v;
  };

  return {
    general: {
      appName: (getValue('app_name') as string) ?? '',
      defaultTemplateColumns: (getValue('default_template_columns') as string[]) ?? ['To Do', 'In Progress', 'Done'],
      maxFileUploadSize: (getValue('max_file_upload_size') as number) ?? 10485760,
      allowedFileTypes: (getValue('allowed_file_types') as string[]) ?? ['image/png', 'image/jpeg', 'application/pdf'],
    },
    notifications: {
      globalEmailEnabled: (getValue('global_email_enabled') as boolean) ?? true,
      defaultDigestFrequency: (getValue('default_digest_frequency') as 'OFF' | 'DAILY' | 'WEEKLY') ?? 'DAILY',
      deadlineReminderHours: (getValue('deadline_reminder_hours') as number) ?? 24,
    },
  };
}

export const adminSettingsService = {
  getSettings: async (): Promise<AdminSettings> => {
    const raw = await httpService.get<SystemSettingRow[]>('/admin/settings');
    return transformSettingsArray(raw);
  },

  updateGeneral: (data: Partial<AdminSettings['general']>) =>
    httpService.patch<AdminSettings['general']>('/admin/settings/general', data),

  updateNotifications: (data: Partial<AdminSettings['notifications']>) =>
    httpService.patch<AdminSettings['notifications']>('/admin/settings/notifications', data),

  getLabels: () =>
    httpService.get<AdminLabel[]>('/admin/settings/labels'),

  createLabel: (data: { name: string; color: string }) =>
    httpService.post<AdminLabel>('/admin/settings/labels', data),

  updateLabel: (labelId: string, data: { name?: string; color?: string }) =>
    httpService.patch<AdminLabel>(`/admin/settings/labels/${labelId}`, data),

  deleteLabel: (labelId: string) =>
    httpService.delete(`/admin/settings/labels/${labelId}`),
};
