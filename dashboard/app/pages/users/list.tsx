import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Pencil, Ban, Trash2, UserPlus, ChevronDown, ShieldCheck, ShieldOff, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Breadcrumb } from '~/components/shared/breadcrumb';
import { SearchInput } from '~/components/shared/search-input';
import { SelectFilter } from '~/components/shared/select-filter';
import { DataTable } from '~/components/shared/data-table';
import { Pagination } from '~/components/shared/pagination';
import { StatusBadge } from '~/components/shared/status-badge';
import { Avatar } from '~/components/shared/avatar';
import { ConfirmDialog } from '~/components/shared/confirm-dialog';
import { adminUserService } from '~/services/httpServices/adminUserService';
import { adminExportService } from '~/services/httpServices/adminExportService';

import type { Column } from '~/components/shared/data-table';
import type { AdminUser } from '~/types/admin';

import CreateUserModal from './create-modal';
import UserDetailDrawer from './detail-drawer';

// ---------- Helpers ----------

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

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return 'Just now';

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;

    return formatDate(dateStr);
  } catch {
    return 'Never';
  }
}

// ---------- Filter Options ----------

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROJECT_OWNER', label: 'Project Owner' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

// ---------- Sort field mapping (frontend key → backend column) ----------

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'full_name',
  email: 'email',
  role: 'role',
  status: 'status',
  createdAt: 'created_at',
  lastActive: 'last_active_at',
};

// ---------- Component ----------

export default function UserList() {
  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / drawer / confirm state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'suspend';
    userId: string;
    userName: string;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Bulk actions dropdown
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Close bulk dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) {
        setIsBulkOpen(false);
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  // ---------- Data Fetching ----------

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminUserService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      setUsers(result?.data ?? []);
      setTotal(result?.meta?.total ?? 0);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
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

  // ---------- Actions ----------

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await adminUserService.deleteUser(confirmAction.userId);
        toast.success('User deleted successfully');
      } else {
        await adminUserService.changeStatus(confirmAction.userId, 'SUSPENDED');
        toast.success('User suspended successfully');
      }
      setConfirmAction(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  }, [confirmAction, fetchUsers]);

  const handleBulkAction = useCallback(
    async (action: 'activate' | 'suspend' | 'delete') => {
      if (selectedIds.length === 0) return;
      setIsBulkOpen(false);
      try {
        await adminUserService.bulkAction({ userIds: selectedIds, action });
        setSelectedIds([]);
        toast.success(`Bulk ${action} completed for ${selectedIds.length} user(s)`);
        fetchUsers();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Bulk action failed';
        toast.error(message);
      }
    },
    [selectedIds, fetchUsers]
  );

  const handleExportCsv = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await adminExportService.exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    } catch {
      toast.error('Failed to export users');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  // ---------- Table Columns ----------

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'User',
        sortable: true,
        render: (u) => (
          <div className="flex items-center gap-3">
            <Avatar name={u?.name ?? ''} size="sm" />
            <span className="font-medium text-[#1E293B]">{u?.name ?? '-'}</span>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (u) => (
          <span className="text-sm text-[#64748B]">{u?.email ?? '-'}</span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (u) => <StatusBadge status={u?.role ?? ''} variant="badge" />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (u) => <StatusBadge status={u?.status ?? ''} variant="dot" />,
      },
      {
        key: 'projects',
        header: 'Projects',
        align: 'center',
        render: (u) => (
          <span className="text-sm text-[#1E293B]">{u?.projectsCount ?? 0}</span>
        ),
      },
      {
        key: 'tasks',
        header: 'Tasks',
        align: 'center',
        render: (u) => (
          <span className="text-sm text-[#1E293B]">{u?.tasksCount ?? 0}</span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Registered',
        sortable: true,
        render: (u) => (
          <span className="text-sm text-[#64748B]">{formatDate(u?.createdAt)}</span>
        ),
      },
      {
        key: 'lastActive',
        header: 'Last Active',
        render: (u) => (
          <span className="text-sm text-[#64748B]">{relativeTime(u?.lastActiveAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '120px',
        render: (u) => (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#4A90D9] hover:bg-[#4A90D9]/10 transition-colors"
              title="Edit user"
              onClick={() => setDrawerUser(u)}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
              title="Suspend user"
              onClick={() =>
                setConfirmAction({
                  type: 'suspend',
                  userId: u?.id ?? '',
                  userName: u?.name ?? '',
                })
              }
            >
              <Ban className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              title="Delete user"
              onClick={() =>
                setConfirmAction({
                  type: 'delete',
                  userId: u?.id ?? '',
                  userName: u?.name ?? '',
                })
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ---------- Render ----------

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: 'Admin' }, { label: 'User Management' }]} />
        <h1 className="text-2xl font-bold text-[#1E293B] mt-2">User Management</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <SearchInput
          placeholder="Search users..."
          value={search}
          onChange={handleSearchChange}
        />
        <SelectFilter options={ROLE_OPTIONS} value={roleFilter} onChange={handleRoleChange} />
        <SelectFilter options={STATUS_OPTIONS} value={statusFilter} onChange={handleStatusChange} />

        <div className="flex items-center gap-3 sm:ml-auto">
          {/* Bulk Actions */}
          <div className="relative" ref={bulkRef}>
            <button
              disabled={selectedIds.length === 0}
              onClick={() => setIsBulkOpen((prev) => !prev)}
              className="h-[38px] px-4 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm text-[#64748B] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Actions
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isBulkOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-20 w-44">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="w-full text-left px-4 py-2 text-sm text-[#1E293B] hover:bg-gray-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="w-full text-left px-4 py-2 text-sm text-[#1E293B] hover:bg-gray-50 flex items-center gap-2"
                >
                  <ShieldOff className="w-4 h-4 text-[#F59E0B]" />
                  Suspend
                </button>
                <hr className="my-1 border-[#E5E7EB]" />
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="h-[38px] px-4 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm text-[#64748B] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          {/* Create User */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-[38px] px-4 flex items-center gap-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable<AdminUser>
        columns={columns}
        data={users}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(user) => setDrawerUser(user)}
        emptyMessage="No users found"
        sortKey={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success('User created successfully');
          fetchUsers();
        }}
      />

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onRefresh={fetchUsers}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === 'delete'
            ? `Delete ${confirmAction?.userName ?? 'User'}?`
            : `Suspend ${confirmAction?.userName ?? 'User'}?`
        }
        description={
          confirmAction?.type === 'delete'
            ? 'This action cannot be undone. All data associated with this user will be permanently removed.'
            : 'The user will be unable to access the platform until reactivated.'
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Suspend'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        isLoading={isActionLoading}
      />
    </div>
  );
}
