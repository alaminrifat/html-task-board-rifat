import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Bell,
  Tag,
  Trash2,
  Pencil,
  Plus,
  X,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '~/components/shared/breadcrumb';
import { ToggleSwitch } from '~/components/shared/toggle-switch';
import { Skeleton } from '~/components/shared/skeleton';
import { ConfirmDialog } from '~/components/shared/confirm-dialog';
import { adminSettingsService } from '~/services/httpServices/adminSettingsService';
import type { AdminSettings, AdminLabel } from '~/types/admin';

// ---------------------------------------------------------------------------
// Local form state types
// ---------------------------------------------------------------------------

interface FormGeneral {
  appName: string;
  defaultTemplateColumns: string[];
  maxFileUploadSize: number;
  allowedFileTypes: string[];
}

interface FormNotifications {
  globalEmailEnabled: boolean;
  defaultDigestFrequency: 'OFF' | 'DAILY' | 'WEEKLY';
  deadlineReminderHours: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SystemConfig() {
  // ------ API data ------
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [labels, setLabels] = useState<AdminLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ------ Form state ------
  const [formGeneral, setFormGeneral] = useState<FormGeneral>({
    appName: '',
    defaultTemplateColumns: ['To Do', 'In Progress', 'Done'],
    maxFileUploadSize: 10485760,
    allowedFileTypes: ['image/png', 'image/jpeg', 'application/pdf'],
  });
  const [formNotifications, setFormNotifications] = useState<FormNotifications>({
    globalEmailEnabled: true,
    defaultDigestFrequency: 'DAILY',
    deadlineReminderHours: 24,
  });
  const [isDirty, setIsDirty] = useState(false);

  // ------ Snapshot of last-fetched values (for discard) ------
  const [snapshotGeneral, setSnapshotGeneral] = useState<FormGeneral | null>(null);
  const [snapshotNotifications, setSnapshotNotifications] = useState<FormNotifications | null>(null);

  // ------ Label management ------
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#64748B');
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isDeletingLabel, setIsDeletingLabel] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('#64748B');
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  // =====================================================================
  // Helpers to build form state from API data
  // =====================================================================

  const buildGeneral = (data: AdminSettings | null): FormGeneral => ({
    appName: data?.general?.appName ?? '',
    defaultTemplateColumns: data?.general?.defaultTemplateColumns ?? ['To Do', 'In Progress', 'Done'],
    maxFileUploadSize: data?.general?.maxFileUploadSize ?? 10485760,
    allowedFileTypes: data?.general?.allowedFileTypes ?? ['image/png', 'image/jpeg', 'application/pdf'],
  });

  const buildNotifications = (data: AdminSettings | null): FormNotifications => ({
    globalEmailEnabled: data?.notifications?.globalEmailEnabled ?? true,
    defaultDigestFrequency: data?.notifications?.defaultDigestFrequency ?? 'DAILY',
    deadlineReminderHours: data?.notifications?.deadlineReminderHours ?? 24,
  });

  // =====================================================================
  // Data fetching
  // =====================================================================

  const fetchSettings = useCallback(async () => {
    try {
      const data = await adminSettingsService.getSettings();
      setSettings(data);
      const general = buildGeneral(data);
      const notifications = buildNotifications(data);
      setFormGeneral(general);
      setFormNotifications(notifications);
      setSnapshotGeneral(general);
      setSnapshotNotifications(notifications);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const data = await adminSettingsService.getLabels();
      setLabels(data ?? []);
    } catch {
      // Labels fetch failure is non-critical
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchLabels()]);
      setIsLoading(false);
    };
    load();
  }, [fetchSettings, fetchLabels]);

  // =====================================================================
  // Dirty tracking
  // =====================================================================

  useEffect(() => {
    if (!snapshotGeneral || !snapshotNotifications) return;
    const generalDirty =
      formGeneral.appName !== snapshotGeneral.appName ||
      JSON.stringify(formGeneral.defaultTemplateColumns) !== JSON.stringify(snapshotGeneral.defaultTemplateColumns) ||
      formGeneral.maxFileUploadSize !== snapshotGeneral.maxFileUploadSize ||
      JSON.stringify(formGeneral.allowedFileTypes) !== JSON.stringify(snapshotGeneral.allowedFileTypes);
    const notifDirty =
      formNotifications.globalEmailEnabled !== snapshotNotifications.globalEmailEnabled ||
      formNotifications.defaultDigestFrequency !== snapshotNotifications.defaultDigestFrequency ||
      formNotifications.deadlineReminderHours !== snapshotNotifications.deadlineReminderHours;
    setIsDirty(generalDirty || notifDirty);
  }, [formGeneral, formNotifications, snapshotGeneral, snapshotNotifications]);

  // =====================================================================
  // Save / Discard
  // =====================================================================

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        adminSettingsService.updateGeneral({
          appName: formGeneral.appName,
          defaultTemplateColumns: formGeneral.defaultTemplateColumns,
          maxFileUploadSize: formGeneral.maxFileUploadSize,
          allowedFileTypes: formGeneral.allowedFileTypes,
        }),
        adminSettingsService.updateNotifications({
          globalEmailEnabled: formNotifications.globalEmailEnabled,
          defaultDigestFrequency: formNotifications.defaultDigestFrequency,
          deadlineReminderHours: formNotifications.deadlineReminderHours,
        }),
      ]);
      toast.success('Settings saved successfully');
      await fetchSettings();
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!snapshotGeneral || !snapshotNotifications) return;
    setFormGeneral({ ...snapshotGeneral });
    setFormNotifications({ ...snapshotNotifications });
  };

  // =====================================================================
  // General helpers
  // =====================================================================

  const updateGeneral = <K extends keyof FormGeneral>(key: K, value: FormGeneral[K]) => {
    setFormGeneral((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotifications = <K extends keyof FormNotifications>(key: K, value: FormNotifications[K]) => {
    setFormNotifications((prev) => ({ ...prev, [key]: value }));
  };

  // =====================================================================
  // Labels
  // =====================================================================

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    setIsAddingLabel(true);
    try {
      await adminSettingsService.createLabel({ name: newLabelName.trim(), color: newLabelColor });
      setNewLabelName('');
      setNewLabelColor('#64748B');
      toast.success('Label added successfully');
      await fetchLabels();
    } catch {
      toast.error('Failed to add label');
    } finally {
      setIsAddingLabel(false);
    }
  };

  const handleDeleteLabel = async () => {
    if (!deletingLabelId) return;
    setIsDeletingLabel(true);
    try {
      await adminSettingsService.deleteLabel(deletingLabelId);
      setDeletingLabelId(null);
      toast.success('Label deleted successfully');
      await fetchLabels();
    } catch {
      toast.error('Failed to delete label');
    } finally {
      setIsDeletingLabel(false);
    }
  };

  const startEditLabel = (label: AdminLabel) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const cancelEditLabel = () => {
    setEditingLabelId(null);
    setEditLabelName('');
    setEditLabelColor('#64748B');
  };

  const saveEditLabel = async () => {
    if (!editingLabelId || !editLabelName.trim()) return;
    setIsSavingLabel(true);
    try {
      await adminSettingsService.updateLabel(editingLabelId, {
        name: editLabelName.trim(),
        color: editLabelColor,
      });
      cancelEditLabel();
      toast.success('Label updated successfully');
      await fetchLabels();
    } catch {
      toast.error('Failed to update label');
    } finally {
      setIsSavingLabel(false);
    }
  };

  // =====================================================================
  // Render: Loading skeleton
  // =====================================================================

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // =====================================================================
  // Render: Fatal error
  // =====================================================================

  if (error && !settings) {
    return (
      <div className="flex-1">
        <Breadcrumb items={[{ label: 'Admin' }, { label: 'System Configuration' }]} />
        <div className="mt-6 bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center">
          <p className="text-sm text-[#EF4444] mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              Promise.all([fetchSettings(), fetchLabels()]).finally(() => setIsLoading(false));
            }}
            className="h-[36px] px-4 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // =====================================================================
  // Render: Main page
  // =====================================================================

  return (
    <div className="flex-1">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'System Configuration' }]} />
          <h1 className="text-2xl font-semibold tracking-tight text-[#1E293B]">
            System Configuration
          </h1>
          <p className="text-sm text-[#64748B]">
            Manage global settings, notifications, and labels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
            className="h-[36px] px-4 flex items-center gap-2 border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="h-[36px] px-5 flex items-center gap-2 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </header>


      {/* ----------------------------------------------------------------- */}
      {/* Two-column settings grid                                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* =============================================================== */}
        {/* LEFT COLUMN - General Settings                                  */}
        {/* =============================================================== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden self-start">
          {/* Section header */}
          <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center text-[#4A90D9] flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1E293B]">General Settings</h4>
              <p className="text-xs text-[#64748B]">Configure core application settings</p>
            </div>
          </div>

          {/* Section content */}
          <div className="px-6 py-5 flex flex-col gap-0">
            {/* Application Name */}
            <div className="flex flex-col gap-2 pb-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Application Name</label>
              <input
                type="text"
                value={formGeneral.appName}
                onChange={(e) => updateGeneral('appName', e.target.value)}
                placeholder="TaskBoard"
                className="h-[40px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white"
              />
            </div>

            {/* Default Kanban Columns */}
            <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Default Kanban Columns</label>
              <p className="text-xs text-[#64748B]">Default columns for new project boards (1-10)</p>
              <div className="flex flex-col gap-2 mt-1">
                {formGeneral.defaultTemplateColumns.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => {
                        const updated = [...formGeneral.defaultTemplateColumns];
                        updated[idx] = e.target.value;
                        updateGeneral('defaultTemplateColumns', updated);
                      }}
                      className="flex-1 h-[36px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formGeneral.defaultTemplateColumns.length <= 1) return;
                        const updated = formGeneral.defaultTemplateColumns.filter((_, i) => i !== idx);
                        updateGeneral('defaultTemplateColumns', updated);
                      }}
                      disabled={formGeneral.defaultTemplateColumns.length <= 1}
                      className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Remove column ${col}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formGeneral.defaultTemplateColumns.length < 10 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateGeneral('defaultTemplateColumns', [...formGeneral.defaultTemplateColumns, ''])
                    }
                    className="mt-1 h-[36px] px-4 flex items-center gap-1.5 self-start border border-dashed border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:border-[#4A90D9] hover:text-[#4A90D9] hover:bg-[#F8FAFC] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Column
                  </button>
                )}
              </div>
            </div>

            {/* Max File Upload Size */}
            <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Max File Upload Size</label>
              <p className="text-xs text-[#64748B]">Maximum upload size per file (1 - 50 MB)</p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={Math.round(formGeneral.maxFileUploadSize / 1048576)}
                  onChange={(e) => {
                    const mb = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                    updateGeneral('maxFileUploadSize', mb * 1048576);
                  }}
                  className="w-24 h-[40px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm font-medium text-[#64748B]">MB</span>
              </div>
            </div>

            {/* Allowed File Types */}
            <div className="flex flex-col gap-2 pt-5">
              <label className="text-sm font-medium text-[#1E293B]">Allowed File Types</label>
              <p className="text-xs text-[#64748B]">MIME types accepted for uploads (max 20)</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {formGeneral.allowedFileTypes.map((ft, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 h-[28px] px-2.5 bg-[#F1F5F9] text-sm text-[#1E293B] rounded-md border border-[#E5E7EB]"
                  >
                    {ft}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formGeneral.allowedFileTypes.filter((_, i) => i !== idx);
                        updateGeneral('allowedFileTypes', updated);
                      }}
                      className="p-0.5 text-[#94A3B8] hover:text-[#EF4444] rounded transition-colors"
                      aria-label={`Remove type ${ft}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {formGeneral.allowedFileTypes.length < 20 && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="e.g. image/webp"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !formGeneral.allowedFileTypes.includes(val)) {
                          updateGeneral('allowedFileTypes', [...formGeneral.allowedFileTypes, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="flex-1 h-[36px] px-3 rounded-lg border border-[#E5E7EB] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !formGeneral.allowedFileTypes.includes(val)) {
                        updateGeneral('allowedFileTypes', [...formGeneral.allowedFileTypes, val]);
                        input.value = '';
                      }
                    }}
                    className="h-[36px] px-4 flex items-center gap-1.5 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* RIGHT COLUMN                                                    */}
        {/* =============================================================== */}
        <div className="flex flex-col gap-6">
          {/* ------------------------------------------------------------- */}
          {/* Notification Settings                                         */}
          {/* ------------------------------------------------------------- */}
          <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E293B]">Notification Settings</h4>
                <p className="text-xs text-[#64748B]">Manage email and reminder preferences</p>
              </div>
            </div>

            {/* Section content */}
            <div className="px-6 py-5 flex flex-col gap-0">
              {/* Global Email Enabled */}
              <div className="pb-5 border-b border-[#F1F5F9]">
                <ToggleSwitch
                  checked={formNotifications.globalEmailEnabled}
                  onChange={(val) => updateNotifications('globalEmailEnabled', val)}
                  label="Email Notifications"
                  description="Enable email notifications globally"
                />
              </div>

              {/* Default Digest Frequency */}
              <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
                <label className="text-sm font-medium text-[#1E293B]">Default Digest Frequency</label>
                <p className="text-xs text-[#64748B]">How often users receive digest emails by default</p>
                <div className="relative mt-1">
                  <select
                    value={formNotifications.defaultDigestFrequency}
                    onChange={(e) =>
                      updateNotifications('defaultDigestFrequency', e.target.value as 'OFF' | 'DAILY' | 'WEEKLY')
                    }
                    className="w-full h-[40px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all cursor-pointer"
                  >
                    <option value="OFF">Off</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#64748B]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Deadline Reminder Hours */}
              <div className="flex flex-col gap-2 pt-5">
                <label className="text-sm font-medium text-[#1E293B]">Deadline Reminder</label>
                <p className="text-xs text-[#64748B]">Send a reminder this many hours before a task deadline (1 - 168)</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={formNotifications.deadlineReminderHours}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(168, Number(e.target.value) || 1));
                      updateNotifications('deadlineReminderHours', val);
                    }}
                    className="w-24 h-[40px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-medium text-[#64748B]">hours before deadline</span>
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* Label Configuration                                           */}
          {/* ------------------------------------------------------------- */}
          <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] flex-shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E293B]">Label Configuration</h4>
                <p className="text-xs text-[#64748B]">Customize project labels and colors</p>
              </div>
            </div>

            {/* Label list */}
            <div className="px-6 py-4 flex flex-col gap-1">
              {(labels ?? []).length === 0 && (
                <p className="text-sm text-[#94A3B8] text-center py-4">No labels configured yet.</p>
              )}

              {(labels ?? []).map((label) => (
                <div key={label.id}>
                  {editingLabelId === label.id ? (
                    /* ---- Inline edit mode ---- */
                    <div className="flex items-center h-[42px] gap-3 px-3 rounded-lg bg-[#F8FAFC]">
                      <label className="relative w-5 h-5 flex-shrink-0 cursor-pointer">
                        <input
                          type="color"
                          value={editLabelColor}
                          onChange={(e) => setEditLabelColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span
                          className="block w-5 h-5 rounded-full border border-black/5"
                          style={{ backgroundColor: editLabelColor }}
                        />
                      </label>
                      <input
                        type="text"
                        value={editLabelName}
                        onChange={(e) => setEditLabelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditLabel();
                          if (e.key === 'Escape') cancelEditLabel();
                        }}
                        className="flex-1 h-[32px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:border-[#4A90D9] focus:outline-none bg-white"
                        autoFocus
                      />
                      <button
                        onClick={saveEditLabel}
                        disabled={!editLabelName.trim() || isSavingLabel}
                        className="h-[32px] px-3 bg-[#4A90D9] text-white text-xs font-medium rounded-lg hover:bg-[#3B82F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingLabel ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                      <button
                        onClick={cancelEditLabel}
                        disabled={isSavingLabel}
                        className="h-[32px] px-3 border border-[#E5E7EB] text-xs font-medium text-[#64748B] rounded-lg hover:bg-white hover:text-[#1E293B] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    /* ---- View mode ---- */
                    <div className="flex items-center h-[42px] gap-3 px-3 rounded-lg hover:bg-[#F8FAFC] transition-colors group">
                      <div
                        className="w-5 h-5 rounded-full border border-black/5 flex-shrink-0"
                        style={{ backgroundColor: label.color ?? '#64748B' }}
                      />
                      <span className="text-sm text-[#1E293B] flex-1">{label.name ?? ''}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditLabel(label)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#4A90D9] hover:bg-blue-50 rounded-md transition-colors"
                          aria-label={`Edit label ${label.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingLabelId(label.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors"
                          aria-label={`Delete label ${label.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add label row */}
              <div className="flex items-center gap-3 mt-2 pt-4 border-t border-dashed border-[#E5E7EB]">
                <label className="relative w-5 h-5 flex-shrink-0 cursor-pointer">
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span
                    className="block w-5 h-5 rounded-full border border-black/5"
                    style={{ backgroundColor: newLabelColor }}
                  />
                </label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLabel();
                  }}
                  placeholder="New label name"
                  className="flex-1 h-[36px] px-3 rounded-lg border border-[#E5E7EB] text-sm focus:border-[#4A90D9] focus:outline-none placeholder-[#94A3B8] bg-white"
                />
                <button
                  onClick={handleAddLabel}
                  disabled={!newLabelName.trim() || isAddingLabel}
                  className="h-[36px] px-4 flex items-center gap-1.5 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingLabel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-8" />

      {/* ----------------------------------------------------------------- */}
      {/* Confirm Delete Label Dialog                                       */}
      {/* ----------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={!!deletingLabelId}
        onClose={() => setDeletingLabelId(null)}
        onConfirm={handleDeleteLabel}
        title="Delete Label"
        description="Are you sure you want to delete this label? This action cannot be undone. Tasks using this label will have it removed."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingLabel}
      />
    </div>
  );
}

// ===========================================================================
// Loading skeleton
// ===========================================================================

function LoadingSkeleton() {
  return (
    <div className="flex-1">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64 mt-1" />
          <Skeleton className="h-4 w-80 mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-[36px] w-24 rounded-lg" />
          <Skeleton className="h-[36px] w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column skeleton - General Settings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden self-start">
          <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* App Name */}
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-[40px] w-full rounded-lg" />
            </div>
            {/* Default Kanban Columns */}
            <div>
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-56 mb-2" />
              <Skeleton className="h-[36px] w-full rounded-lg mb-2" />
              <Skeleton className="h-[36px] w-full rounded-lg mb-2" />
              <Skeleton className="h-[36px] w-full rounded-lg" />
            </div>
            {/* Max File Upload Size */}
            <div>
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-[40px] w-24 rounded-lg" />
            </div>
            {/* Allowed File Types */}
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-[28px] w-20 rounded-md" />
                <Skeleton className="h-[28px] w-24 rounded-md" />
                <Skeleton className="h-[28px] w-28 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="flex flex-col gap-6">
          {/* Notification Settings skeleton */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Email Notifications toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="w-[44px] h-[24px] rounded-full" />
              </div>
              {/* Default Digest Frequency */}
              <div>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-56 mb-2" />
                <Skeleton className="h-[40px] w-full rounded-lg" />
              </div>
              {/* Deadline Reminder Hours */}
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-64 mb-2" />
                <Skeleton className="h-[40px] w-24 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Label Configuration skeleton */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="px-6 py-4 flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 h-[42px] px-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
