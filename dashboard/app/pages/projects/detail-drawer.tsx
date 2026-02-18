import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Users, CheckCircle2, AlertCircle, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Drawer } from '~/components/shared/drawer';
import { Avatar } from '~/components/shared/avatar';
import { StatusBadge } from '~/components/shared/status-badge';
import { Skeleton } from '~/components/shared/skeleton';

import { adminProjectService } from '~/services/httpServices/adminProjectService';

import type { AdminProject, AdminProjectDetail } from '~/types/admin';

// ---------- Constants ----------

const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~150.8

// Default color palette for task status columns in the breakdown bar
const COLUMN_COLORS = [
  { color: 'bg-[#94A3B8]', dot: 'bg-[#94A3B8]' },
  { color: 'bg-[#F59E0B]', dot: 'bg-[#F59E0B]' },
  { color: 'bg-[#8B5CF6]', dot: 'bg-[#8B5CF6]' },
  { color: 'bg-[#10B981]', dot: 'bg-[#10B981]' },
  { color: 'bg-[#EF4444]', dot: 'bg-[#EF4444]' },
  { color: 'bg-[#4A90D9]', dot: 'bg-[#4A90D9]' },
] as const;

const ROLE_BADGE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-50 text-amber-600',
  PROJECT_OWNER: 'bg-amber-50 text-amber-600',
  DEVELOPER: 'bg-blue-50 text-blue-600',
  DESIGNER: 'bg-purple-50 text-purple-600',
  QA: 'bg-emerald-50 text-emerald-600',
  TEAM_MEMBER: 'bg-blue-50 text-blue-600',
  MEMBER: 'bg-blue-50 text-blue-600',
};

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

function getProgressStrokeColor(percent: number): string {
  if (percent >= 100) return '#10B981';
  return '#4A90D9';
}

function getRoleBadgeClass(role: string): string {
  const key = (role ?? '').toUpperCase().replace(/\s+/g, '_');
  return ROLE_BADGE_COLORS[key] ?? 'bg-blue-50 text-blue-600';
}

function formatRoleLabel(role: string): string {
  if (!role) return '';
  const upper = role.toUpperCase();
  if (upper === 'PROJECT_OWNER') return 'Owner';
  if (upper === 'TEAM_MEMBER') return 'Member';
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Props ----------

interface ProjectDetailDrawerProps {
  project: AdminProject | null;
  onClose: () => void;
  onRefresh: () => void;
}

// ---------- Component ----------

export default function ProjectDetailDrawer({
  project,
  onClose,
  onRefresh,
}: ProjectDetailDrawerProps) {
  const [detail, setDetail] = useState<AdminProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = project !== null;

  const fetchDetail = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminProjectService.getProjectById(projectId);
      setDetail(result ?? null);
    } catch {
      setError('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (project?.id) {
      fetchDetail(project.id);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [project?.id, fetchDetail]);

  const handleArchive = useCallback(async () => {
    if (!project?.id) return;
    try {
      await adminProjectService.archiveProject(project.id);
      toast.success('Project archived successfully');
      onClose();
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive project';
      toast.error(message);
    }
  }, [project?.id, onClose, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!project?.id) return;
    try {
      await adminProjectService.deleteProject(project.id);
      toast.success('Project deleted successfully');
      onClose();
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(message);
    }
  }, [project?.id, onClose, onRefresh]);

  // Derived data
  const completionPercent = detail?.completionPercent ?? project?.completionPercent ?? 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - completionPercent / 100);
  const totalTasks = detail?.taskSummary?.total ?? project?.tasksCount ?? 0;
  const membersCount = detail?.membersCount ?? project?.membersCount ?? 0;

  // Build dynamic task breakdown from backend byStatus array
  const byStatus = detail?.taskSummary?.byStatus ?? [];
  const taskBarItems = byStatus.map((entry, idx) => {
    const palette = COLUMN_COLORS[idx % COLUMN_COLORS.length];
    return {
      key: entry.column,
      label: entry.column,
      count: entry.count,
      ...palette,
    };
  });

  const taskBarWidths = totalTasks > 0
    ? taskBarItems.map((item) => ({
        key: item.key,
        width: (item.count / totalTasks) * 100,
        color: item.color,
      }))
    : [];

  // Compute completed tasks as the count of the last column (highest position)
  const completedTasks = byStatus.length > 0 ? byStatus[byStatus.length - 1]?.count ?? 0 : 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="w-[440px]">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#4A90D9] via-[#10B981] to-[#4A90D9] flex-shrink-0" />

      {/* DRAWER HEADER */}
      <div className="px-6 pt-5 pb-5 flex-shrink-0">
        {/* Top row: icon + title + close */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#4A90D9]" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <h3 className="text-lg font-bold text-[#1E293B] tracking-tight truncate">
                  {detail?.title ?? project?.title ?? ''}
                </h3>
              )}
            </div>
            {isLoading ? (
              <div className="ml-10">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-[13px] text-[#64748B] leading-relaxed line-clamp-2 ml-10">
                {detail?.description ?? ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#64748B] transition-colors p-1 rounded-lg hover:bg-gray-100 mt-0.5 flex-shrink-0"
          >
            <X className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* Status badges row */}
        {isLoading ? (
          <div className="flex items-center gap-2 mb-4 ml-10">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4 ml-10">
            <StatusBadge
              status={detail?.status ?? project?.status ?? ''}
              variant="dot"
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50"
            />
            {(detail?.deadline ?? project?.deadline) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-[#F59E0B]">
                <Calendar className="w-3 h-3" />
                Due {formatDate(detail?.deadline ?? project?.deadline)}
              </span>
            )}
          </div>
        )}

        {/* Progress + Stats Row */}
        {isLoading ? (
          <Skeleton className="h-[76px] w-full rounded-xl" />
        ) : (
          <div className="flex items-center gap-4 bg-[#F8FAFC] rounded-xl p-3.5 border border-[#F1F5F9]">
            {/* Circular Progress */}
            <div className="relative w-[56px] h-[56px] flex items-center justify-center flex-shrink-0">
              <svg className="transform -rotate-90 w-full h-full">
                <circle
                  cx="28"
                  cy="28"
                  r={RING_RADIUS}
                  stroke="#E2E8F0"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={RING_RADIUS}
                  stroke={getProgressStrokeColor(completionPercent)}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[15px] font-bold text-[#1E293B]">
                {completionPercent}%
              </span>
            </div>
            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-base font-bold text-[#1E293B] leading-none mb-0.5">
                  {totalTasks}
                </p>
                <p className="text-[11px] text-[#94A3B8] font-medium">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[#1E293B] leading-none mb-0.5">
                  {membersCount}
                </p>
                <p className="text-[11px] text-[#94A3B8] font-medium">Members</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[#10B981] leading-none mb-0.5">
                  {completedTasks}
                </p>
                <p className="text-[11px] text-[#94A3B8] font-medium">Completed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-[#E5E7EB] flex-shrink-0" />

      {/* Error State */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-sm text-[#EF4444] flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => project?.id && fetchDetail(project.id)}
            className="ml-auto text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {/* OWNER INFO */}
        <div className="px-6 py-4">
          <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
            Owner
          </h4>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  name={detail?.owner?.name ?? project?.owner?.name ?? ''}
                  size="md"
                  className="ring-2 ring-white shadow-sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#1E293B]">
                  {detail?.owner?.name ?? project?.owner?.name ?? ''}
                </span>
                {detail?.owner?.email ? (
                  <span className="text-[12px] text-[#4A90D9]">
                    {detail.owner.email}
                  </span>
                ) : (
                  <span className="text-[12px] text-[#4A90D9]">Project Owner</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] mx-6" />

        {/* TASK BREAKDOWN */}
        <div className="px-6 py-4">
          <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
            Task Breakdown
          </h4>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Stacked Progress Bar */}
              <div className="w-full h-2 rounded-full flex overflow-hidden mb-3">
                {taskBarWidths.map((entry, idx) => {
                  if (entry.width <= 0) return null;
                  const isFirst = idx === 0 || taskBarWidths.slice(0, idx).every((prev) => prev.width <= 0);
                  const isLast = idx === taskBarWidths.length - 1 || taskBarWidths.slice(idx + 1).every((next) => next.width <= 0);
                  return (
                    <div
                      key={entry.key}
                      className={`h-full ${entry.color} ${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`}
                      style={{ width: `${entry.width}%` }}
                    />
                  );
                })}
              </div>

              {/* Legend - Mini cards */}
              <div className="grid grid-cols-2 gap-2">
                {taskBarItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]"
                  >
                    <div className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`} />
                    <span className="text-[12px] text-[#64748B]">{item.label}</span>
                    <span className="text-[12px] font-bold text-[#1E293B] ml-auto">
                      {item.count ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] mx-6" />

        {/* MEMBERS LIST */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Members
            </h4>
            <span className="text-[11px] font-semibold text-[#4A90D9] bg-[#4A90D9]/10 px-2 py-0.5 rounded-full">
              {isLoading ? '-' : (detail?.members ?? []).length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-2.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (detail?.members ?? []).length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-4">No members found.</p>
          ) : (
            <div className="space-y-1">
              {(detail?.members ?? []).map((member) => (
                <div
                  key={member?.id ?? Math.random()}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member?.name ?? ''} size="sm" />
                    <span className="text-[13px] text-[#1E293B] group-hover:text-[#4A90D9] transition-colors">
                      {member?.name ?? ''}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getRoleBadgeClass(member?.projectRole ?? '')}`}
                  >
                    {formatRoleLabel(member?.projectRole ?? '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] mx-6" />

        {/* STATS GRID */}
        <div className="px-6 py-4">
          <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
            Project Stats
          </h4>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-[#4A90D9]" />}
                label="Total Tasks"
                value={totalTasks}
              />
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                label="Completed"
                value={completedTasks}
              />
              <StatCard
                icon={<Users className="w-4 h-4 text-[#8B5CF6]" />}
                label="Members"
                value={membersCount}
              />
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />}
                label="Completion"
                value={`${completionPercent}%`}
              />
            </div>
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* ACTIONS FOOTER */}
      <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#FAFBFC] flex items-center justify-between shrink-0">
        <button
          onClick={handleArchive}
          className="text-[13px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <Archive className="w-3.5 h-3.5" />
          Archive
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="text-[13px] font-medium text-[#EF4444] hover:text-red-700 transition-colors hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#1E293B] hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ---------- Stat Card ----------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold text-[#1E293B] leading-none mb-0.5">
          {value}
        </span>
        <span className="text-[11px] text-[#94A3B8] font-medium">{label}</span>
      </div>
    </div>
  );
}
