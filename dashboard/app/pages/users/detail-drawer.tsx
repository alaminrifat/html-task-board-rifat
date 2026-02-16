import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Pencil,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Calendar,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react';

import { Drawer } from '~/components/shared/drawer';
import { Avatar } from '~/components/shared/avatar';
import { StatusBadge } from '~/components/shared/status-badge';
import { Skeleton } from '~/components/shared/skeleton';
import { adminUserService } from '~/services/httpServices/adminUserService';

import type {
  AdminUser,
  AdminUserDetail,
  AdminUserProject,
  AdminUserTask,
} from '~/types/admin';

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

function getRoleDisplayLabel(role: string | undefined | null): string {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    PROJECT_OWNER: 'Owner',
    TEAM_MEMBER: 'Member',
  };
  return map[(role ?? '').toUpperCase()] ?? (role ?? '-');
}

// ---------- Tab types ----------

type TabKey = 'projects' | 'tasks';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
];

// ---------- Props ----------

interface UserDetailDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
  onRefresh: () => void;
}

// ---------- Component ----------

export default function UserDetailDrawer({ user, onClose, onRefresh }: UserDetailDrawerProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('projects');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await adminUserService.getUserById(id);
      setDetail(result ?? null);
    } catch {
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      setActiveTab('projects');
      setIsResettingPassword(false);
      setIsTogglingStatus(false);
      setIsDeletingUser(false);
      fetchDetail(user.id);
    } else {
      setDetail(null);
    }
  }, [user, fetchDetail]);

  const handleResetPassword = useCallback(async () => {
    if (!user?.id || isResettingPassword) return;
    setIsResettingPassword(true);
    try {
      await adminUserService.resetPassword(user.id);
    } catch {
      // Silently handled
    } finally {
      setIsResettingPassword(false);
    }
  }, [user, isResettingPassword]);

  const handleToggleStatus = useCallback(async () => {
    if (!user?.id || isTogglingStatus) return;
    const currentStatus = detail?.status ?? user?.status;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setIsTogglingStatus(true);
    try {
      await adminUserService.changeStatus(user.id, newStatus);
      onRefresh();
      onClose();
    } catch {
      // Silently handled
    } finally {
      setIsTogglingStatus(false);
    }
  }, [user, detail, isTogglingStatus, onRefresh, onClose]);

  const handleDelete = useCallback(async () => {
    if (!user?.id || isDeletingUser) return;
    setIsDeletingUser(true);
    try {
      await adminUserService.deleteUser(user.id);
      onRefresh();
      onClose();
    } catch {
      // Silently handled
    } finally {
      setIsDeletingUser(false);
    }
  }, [user, isDeletingUser, onRefresh, onClose]);

  const currentStatus = detail?.status ?? user?.status ?? 'ACTIVE';
  const isActive = currentStatus === 'ACTIVE';

  return (
    <Drawer isOpen={user !== null} onClose={onClose} width="w-[440px]">
      {/* Drawer Header - Gradient accent bar */}
      <div className="relative overflow-hidden flex-shrink-0">
        {/* Subtle gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4A90D9] via-[#8B5CF6] to-[#4A90D9]" />

        <div className="px-6 pt-6 pb-5 flex flex-col items-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B] transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close drawer"
          >
            <X className="w-[22px] h-[22px]" />
          </button>

          {isLoading ? (
            <HeaderSkeleton />
          ) : detail ? (
            <>
              {/* Avatar with online status ring */}
              <div className="relative mb-3 mt-1">
                <Avatar
                  name={detail?.name ?? ''}
                  size="lg"
                  className="w-[72px] h-[72px] text-2xl ring-4 ring-white shadow-lg"
                />
                {isActive && (
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#10B981] border-[2.5px] border-white" />
                )}
              </div>

              <h2 className="text-lg font-bold text-[#1E293B] tracking-tight">
                {detail?.name ?? '-'}
              </h2>
              <p className="text-[13px] text-[#64748B] mb-3">
                {detail?.email ?? '-'}
              </p>

              {/* Role and status badges */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <ShieldCheck className="w-3 h-3" />
                  {getRoleDisplayLabel(detail?.role)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-[#10B981]'
                      : 'bg-red-50 text-[#EF4444]'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    }`}
                  />
                  {isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            </>
          ) : (
            <div className="py-8 text-sm text-[#64748B]">Unable to load user details.</div>
          )}
        </div>

        {/* Action buttons row */}
        {!isLoading && detail && (
          <div className="px-5 pb-5 flex gap-2">
            <button className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#4A90D9] text-white rounded-lg text-[13px] font-medium hover:bg-[#3A7BC8] transition-colors shadow-sm">
              <Pencil className="w-3.5 h-3.5" />
              Edit User
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="h-9 px-3 flex items-center justify-center gap-1.5 border border-[#E5E7EB] text-[#64748B] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResettingPassword ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              Reset Password
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`h-9 w-9 flex items-center justify-center border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-[#E5E7EB] text-[#94A3B8] hover:text-[#EF4444] hover:border-red-200 hover:bg-red-50'
                  : 'border-[#E5E7EB] text-[#94A3B8] hover:text-[#10B981] hover:border-emerald-200 hover:bg-emerald-50'
              }`}
              title={isActive ? 'Deactivate User' : 'Activate User'}
            >
              {isTogglingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isActive ? (
                <ShieldOff className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-[#E5E7EB]" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ContentSkeleton />
        ) : detail ? (
          <>
            {/* Stats Cards - 3 column grid */}
            <div className="px-5 py-4 grid grid-cols-3 gap-3">
              <StatCard
                icon={<FolderOpen className="w-4 h-4 text-[#4A90D9]" />}
                value={String(detail?.stats?.projectsCount ?? detail?.projectsCount ?? 0)}
                label="Projects"
              />
              <StatCard
                icon={<CheckSquare className="w-4 h-4 text-[#10B981]" />}
                value={String(detail?.stats?.tasksCompleted ?? detail?.tasksCount ?? 0)}
                label="Completed"
              />
              <StatCard
                icon={<BarChart3 className="w-4 h-4 text-[#8B5CF6]" />}
                value={String(detail?.stats?.tasksAssigned ?? 0)}
                label="Assigned"
              />
            </div>

            {/* Detail rows */}
            <div className="px-5 pb-4">
              <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                Details
              </h4>
              <div className="space-y-3">
                <DetailRow
                  icon={<FolderOpen className="w-[15px] h-[15px]" />}
                  label="Projects"
                  value={String(detail?.projectsCount ?? 0)}
                />
                <DetailRow
                  icon={<CheckSquare className="w-[15px] h-[15px]" />}
                  label="Tasks"
                  value={String(detail?.tasksCount ?? 0)}
                />
                <DetailRow
                  icon={<Calendar className="w-[15px] h-[15px]" />}
                  label="Registered"
                  value={formatDate(detail?.createdAt)}
                />
                <DetailRow
                  icon={<Clock className="w-[15px] h-[15px]" />}
                  label="Last Active"
                  value={relativeTime(detail?.lastActiveAt)}
                  valueClassName={
                    detail?.lastActiveAt ? 'text-[#10B981]' : undefined
                  }
                />
              </div>
            </div>

            <div className="h-px bg-[#E5E7EB] mx-5" />

            {/* Tabs */}
            <div className="px-5 pt-1">
              <div className="flex gap-1">
                {TABS.map((tab) => {
                  const isTabActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-2.5 text-[13px] font-medium border-b-2 rounded-t-md transition-colors ${
                        isTabActive
                          ? 'text-[#4A90D9] border-[#4A90D9] bg-[#4A90D9]/5'
                          : 'text-[#64748B] border-transparent hover:text-[#1E293B] hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-[#E5E7EB]" />

            {/* Tab Content */}
            <div className="px-5 py-3">
              {activeTab === 'projects' && (
                <ProjectsTab projects={detail?.projects ?? []} />
              )}
              {activeTab === 'tasks' && (
                <TasksTab tasks={detail?.recentTasks ?? []} />
              )}
            </div>

            {/* Scroll spacer */}
            <div className="h-2" />
          </>
        ) : (
          <div className="p-6 text-center text-sm text-[#64748B]">
            Unable to load user details.
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#FAFBFC] flex justify-between items-center flex-shrink-0">
        <button
          onClick={handleDelete}
          disabled={isDeletingUser}
          className="text-[13px] font-medium text-[#EF4444] hover:text-red-700 transition-colors hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeletingUser ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Delete User
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#1E293B] hover:bg-gray-50 transition-colors shadow-sm"
        >
          Close
        </button>
      </div>
    </Drawer>
  );
}

// ---------- Stat Card ----------

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#F1F5F9]">
      <div className="flex items-center justify-center mb-1.5">{icon}</div>
      <p className="text-lg font-bold text-[#1E293B] leading-none mb-0.5">{value}</p>
      <p className="text-[11px] text-[#94A3B8] font-medium">{label}</p>
    </div>
  );
}

// ---------- Detail Row ----------

function DetailRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[#64748B]">
        {icon}
        <span className="text-[13px]">{label}</span>
      </div>
      <span className={`text-[13px] font-medium ${valueClassName ?? 'text-[#1E293B]'}`}>
        {value}
      </span>
    </div>
  );
}

// ---------- Projects Tab ----------

function ProjectsTab({ projects }: { projects: AdminUserProject[] }) {
  const safeProjects = projects ?? [];

  if (safeProjects.length === 0) {
    return (
      <p className="text-sm text-[#64748B] text-center py-6">No projects assigned.</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {safeProjects.map((project) => (
        <div
          key={project?.id ?? Math.random()}
          className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#4A90D9]/30 hover:shadow-sm transition-all cursor-pointer group bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderOpen className="w-3.5 h-3.5 text-[#4A90D9]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[#1E293B] group-hover:text-[#4A90D9] transition-colors">
                {project?.title ?? '-'}
              </h3>
            </div>
            <StatusBadge
              status={project?.role ?? ''}
              variant="badge"
              className="rounded-full text-[11px] px-2 py-0.5"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Tasks Tab ----------

function TasksTab({ tasks }: { tasks: AdminUserTask[] }) {
  const safeTasks = tasks ?? [];

  if (safeTasks.length === 0) {
    return (
      <p className="text-sm text-[#64748B] text-center py-6">No recent tasks.</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {safeTasks.map((task) => (
        <div
          key={task?.id ?? Math.random()}
          className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#4A90D9]/30 hover:shadow-sm transition-all cursor-pointer group bg-white"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-[#10B981]" />
              </div>
              <span className="text-[13px] font-medium text-[#1E293B] group-hover:text-[#4A90D9] transition-colors">
                {task?.title ?? '-'}
              </span>
            </div>
            <StatusBadge
              status={task?.columnTitle ?? task?.priority ?? ''}
              variant="badge"
              className="rounded-full text-[11px] px-2 py-0.5"
            />
          </div>
          {task?.projectTitle && (
            <p className="text-[11px] text-[#94A3B8] mt-1.5 ml-9">
              {task.projectTitle}
              {task?.dueDate ? ` \u00B7 Due ${formatDate(task.dueDate)}` : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Header Skeleton ----------

function HeaderSkeleton() {
  return (
    <div className="flex flex-col items-center mt-1">
      <Skeleton className="w-[72px] h-[72px] rounded-full mb-3" />
      <Skeleton className="w-32 h-5 mb-2" />
      <Skeleton className="w-44 h-4 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    </div>
  );
}

// ---------- Content Skeleton ----------

function ContentSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Stats skeleton */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#F8FAFC] rounded-xl p-3 flex flex-col items-center border border-[#F1F5F9]">
            <Skeleton className="w-4 h-4 mb-1.5" />
            <Skeleton className="w-8 h-5 mb-0.5" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
      {/* Details skeleton */}
      <div className="px-5 pb-4">
        <Skeleton className="w-14 h-3 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          ))}
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="h-px bg-[#E5E7EB] mx-5" />
      <div className="px-5 pt-3 pb-4">
        <div className="flex gap-2 mb-4">
          <Skeleton className="w-16 h-8 rounded-md" />
          <Skeleton className="w-16 h-8 rounded-md" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
