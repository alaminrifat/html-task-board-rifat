import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, Archive, Trash2, PlusCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Breadcrumb } from '~/components/shared/breadcrumb';
import { SearchInput } from '~/components/shared/search-input';
import { SelectFilter } from '~/components/shared/select-filter';
import { DataTable } from '~/components/shared/data-table';
import { Pagination } from '~/components/shared/pagination';
import { StatusBadge } from '~/components/shared/status-badge';
import { ConfirmDialog } from '~/components/shared/confirm-dialog';

import { adminProjectService } from '~/services/httpServices/adminProjectService';
import { adminExportService } from '~/services/httpServices/adminExportService';

import type { Column } from '~/components/shared/data-table';
import type { AdminProject } from '~/types/admin';

import ProjectDetailDrawer from './detail-drawer';
import CreateProjectModal from './create-modal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const BREADCRUMB_ITEMS = [
  { label: 'Admin' },
  { label: 'Project Management' },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '-';
  }
}

function getProgressBarColor(percent: number): string {
  if (percent >= 100) return 'bg-[#10B981]';
  return 'bg-[#4A90D9]';
}

// ---------- Sort field mapping (frontend key → backend column) ----------

const SORT_FIELD_MAP: Record<string, string> = {
  title: 'title',
  status: 'status',
  membersCount: 'members_count',
  tasksCount: 'tasks_count',
  completionPercent: 'completion_percent',
  createdAt: 'created_at',
  deadline: 'deadline',
};

export default function ProjectList() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [drawerProject, setDrawerProject] = useState<AdminProject | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'archive' | 'delete';
    projectId: string;
    projectName: string;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminProjectService.getProjects({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      setProjects(result?.data ?? []);
      setTotal(result?.meta?.total ?? 0);
    } catch {
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleRowClick = useCallback((project: AdminProject) => {
    setDrawerProject(project);
  }, []);

  const handleArchive = useCallback((project: AdminProject) => {
    setConfirmAction({
      type: 'archive',
      projectId: project.id,
      projectName: project.title,
    });
  }, []);

  const handleDelete = useCallback((project: AdminProject) => {
    setConfirmAction({
      type: 'delete',
      projectId: project.id,
      projectName: project.title,
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    setIsConfirmLoading(true);
    try {
      if (confirmAction.type === 'archive') {
        await adminProjectService.archiveProject(confirmAction.projectId);
        toast.success('Project archived successfully');
      } else {
        await adminProjectService.deleteProject(confirmAction.projectId);
        toast.success('Project deleted successfully');
      }
      setConfirmAction(null);
      fetchProjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast.error(message);
    } finally {
      setIsConfirmLoading(false);
    }
  }, [confirmAction, fetchProjects]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string) => {
    const backendField = SORT_FIELD_MAP[key] ?? key;
    setSortBy((prev) => {
      if (prev === backendField) {
        setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        return prev;
      }
      setSortOrder('ASC');
      return backendField;
    });
    setPage(1);
  }, []);

  const handleExportCsv = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await adminExportService.exportProjects();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projects-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Projects exported successfully');
    } catch {
      toast.error('Failed to export projects');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const columns: Column<AdminProject>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Project Name',
        sortable: true,
        render: (item) => (
          <span className="text-sm font-semibold text-[#1E293B]">
            {item?.title ?? ''}
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (item) => (
          <span className="text-sm text-[#1E293B]">
            {item?.owner?.name ?? ''}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (item) => (
          <StatusBadge status={item?.status ?? ''} variant="badge" />
        ),
      },
      {
        key: 'membersCount',
        header: 'Members',
        align: 'center',
        render: (item) => (
          <span className="text-sm text-[#64748B]">
            {item?.membersCount ?? 0}
          </span>
        ),
      },
      {
        key: 'tasksCount',
        header: 'Tasks',
        align: 'center',
        render: (item) => (
          <span className="text-sm text-[#64748B]">
            {item?.tasksCount ?? 0}
          </span>
        ),
      },
      {
        key: 'completionPercent',
        header: 'Completion %',
        render: (item) => {
          const percent = item?.completionPercent ?? 0;
          return (
            <div className="flex items-center gap-3">
              <div className="w-[60px] h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getProgressBarColor(percent)}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[#64748B]">
                {percent}%
              </span>
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        render: (item) => (
          <span className="text-sm text-[#64748B]">
            {formatDate(item?.createdAt)}
          </span>
        ),
      },
      {
        key: 'deadline',
        header: 'Deadline',
        sortable: true,
        render: (item) => (
          <span className="text-sm text-[#64748B]">
            {formatDate(item?.deadline)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (item) => (
          <div
            className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-1.5 text-[#64748B] hover:text-[#4A90D9] hover:bg-blue-50 rounded-md transition-colors"
              title="View details"
              onClick={() => setDrawerProject(item)}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-[#64748B] hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
              title="Archive project"
              onClick={() => handleArchive(item)}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors"
              title="Delete project"
              onClick={() => handleDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleArchive, handleDelete]
  );

  return (
    <div className="flex-1">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <Breadcrumb items={BREADCRUMB_ITEMS} />
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
          Project Management
        </h1>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput
            placeholder="Search projects, owners..."
            value={search}
            onChange={setSearch}
          />
          <SelectFilter
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#64748B] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A90D9] hover:bg-[#3b82f6] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-[18px] h-[18px]" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#EF4444]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchProjects}
            className="ml-auto text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable<AdminProject>
        columns={columns}
        data={projects}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={handleRowClick}
        emptyMessage="No projects found"
        sortKey={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        project={drawerProject}
        onClose={() => setDrawerProject(null)}
        onRefresh={fetchProjects}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success('Project created successfully');
          fetchProjects();
        }}
      />

      {/* Confirm Dialog (Archive / Delete) */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmAction?.type === 'archive'
            ? `Archive "${confirmAction?.projectName ?? ''}"`
            : `Delete "${confirmAction?.projectName ?? ''}"`
        }
        description={
          confirmAction?.type === 'archive'
            ? 'This project will be moved to the archive. Members will lose access but data will be preserved.'
            : 'This action cannot be undone. All project data, tasks, and member associations will be permanently removed.'
        }
        confirmLabel={confirmAction?.type === 'archive' ? 'Archive Project' : 'Delete Project'}
        variant={confirmAction?.type === 'archive' ? 'warning' : 'danger'}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
