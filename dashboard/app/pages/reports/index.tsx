import { useState, useCallback } from 'react';
import { Users, FolderOpen, ClipboardCheck, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '~/components/shared/breadcrumb';
import { adminExportService } from '~/services/httpServices/adminExportService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  exportFn: (params?: { dateFrom?: string; dateTo?: string }) => Promise<Blob>;
  filename: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function formatDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDefaultDates() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return { from: formatDateString(yesterday), to: formatDateString(today) };
}

export default function Reports() {
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const cards: ExportCard[] = [
    {
      id: 'users',
      title: 'Users Export',
      description: 'Export all users with roles, status, registration date, and activity stats.',
      icon: <Users className="w-5 h-5" />,
      iconBg: 'bg-[#4A90D9]/10 text-[#4A90D9]',
      exportFn: adminExportService.exportUsers,
      filename: 'users-export.csv',
    },
    {
      id: 'projects',
      title: 'Projects Export',
      description: 'Export all projects with owner, status, member count, tasks, and completion.',
      icon: <FolderOpen className="w-5 h-5" />,
      iconBg: 'bg-[#10B981]/10 text-[#10B981]',
      exportFn: adminExportService.exportProjects,
      filename: 'projects-export.csv',
    },
    {
      id: 'tasks',
      title: 'Tasks Export',
      description: 'Export all tasks with status, assignee, priority, due date, and time logged.',
      icon: <ClipboardCheck className="w-5 h-5" />,
      iconBg: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
      exportFn: adminExportService.exportTasks,
      filename: 'tasks-export.csv',
    },
  ];

  const handleExport = useCallback(
    async (card: ExportCard) => {
      if (exportingId) return;
      setExportingId(card.id);
      try {
        const params: { dateFrom?: string; dateTo?: string } = {};
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const blob = await card.exportFn(params);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = card.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`${card.title} downloaded successfully`);
      } catch {
        toast.error(`Failed to export ${card.title.toLowerCase()}`);
      } finally {
        setExportingId(null);
      }
    },
    [exportingId, dateFrom, dateTo]
  );

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb items={[{ label: 'Admin' }, { label: 'Reports' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
          Export &amp; Reports
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Download CSV reports for users, projects, and tasks
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Date Range Filter</h3>
        <p className="text-xs text-[#64748B] mb-4">
          Optionally filter exported data by date range. Leave empty to export all data.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#64748B]">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-[38px] px-3 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#64748B]">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-[38px] px-3 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="h-[38px] px-3 text-sm text-[#64748B] hover:text-[#1E293B] border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors self-end"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => {
          const isExporting = exportingId === card.id;
          return (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col"
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
                >
                  {card.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#1E293B]">{card.title}</h3>
              </div>

              {/* Description */}
              <p className="text-xs text-[#64748B] leading-relaxed mb-5 flex-1">
                {card.description}
              </p>

              {/* Export Button */}
              <button
                onClick={() => handleExport(card)}
                disabled={isExporting}
                className="h-[38px] w-full flex items-center justify-center gap-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
