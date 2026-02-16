import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Download,
  ClipboardList,
  CheckCircle,
  Bell,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import DataState from '~/components/ui/empty-state';
import { dashboardService } from '~/services/httpServices/dashboardService';
import { memberService } from '~/services/httpServices/memberService';
import { cn } from '~/lib/utils';

import type { DashboardSummary, DashboardCharts } from '~/services/httpServices/dashboardService';
import type { ProjectMember } from '~/types/member';

const PRIORITY_FILTER_OPTIONS = ['All Priorities', 'Low', 'Medium', 'High', 'Urgent'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8',
  MEDIUM: '#4A90D9',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
};

const AVATAR_COLORS = [
  { bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]' },
  { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'bg-white border border-[#E5E7EB]', text: 'text-[#94A3B8]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]' },
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' },
] as const;

function getInitials(userId: string): string {
  // Generate deterministic initials from userId
  const chars = userId.replace(/-/g, '').toUpperCase();
  return chars.slice(0, 2);
}

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface DashboardData {
  summary: DashboardSummary;
  charts: DashboardCharts;
  members: ProjectMember[];
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<string>('All Priorities');
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [summaryData, chartsData, membersData] = await Promise.all([
        dashboardService.summary(projectId),
        dashboardService.charts(projectId),
        memberService.list(projectId),
      ]);

      setData({
        summary: summaryData,
        charts: chartsData,
        members: membersData ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(async () => {
    if (!projectId || isExporting) return;

    try {
      setIsExporting(true);
      const blob = await dashboardService.export(projectId, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}-export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Export failed silently
    } finally {
      setIsExporting(false);
    }
  }, [projectId, isExporting]);

  const completionRate = useMemo(() => {
    if (!data?.summary) return 0;
    const { totalTasks, completedTasks } = data.summary;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [data?.summary]);

  const completedPct = useMemo(() => {
    if (!data?.summary) return 0;
    const { totalTasks, completedTasks } = data.summary;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [data?.summary]);

  // Build priority donut segments
  const donutGradient = useMemo(() => {
    if (!data?.charts?.tasksByPriority) return 'conic-gradient(#F1F5F9 0% 100%)';

    const priorityData = data.charts.tasksByPriority;
    const total = Object.values(priorityData).reduce((sum, v) => sum + v, 0);
    if (total === 0) return 'conic-gradient(#F1F5F9 0% 100%)';

    const orderedKeys = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    let accumulated = 0;
    const segments: string[] = [];

    for (const key of orderedKeys) {
      const value = priorityData[key] ?? 0;
      if (value === 0) continue;
      const startPct = (accumulated / total) * 100;
      accumulated += value;
      const endPct = (accumulated / total) * 100;
      const color = PRIORITY_COLORS[key] ?? '#94A3B8';
      segments.push(`${color} ${startPct}% ${endPct}%`);
    }

    // Include any remaining keys not in orderedKeys
    for (const [key, value] of Object.entries(priorityData)) {
      if (orderedKeys.includes(key) || value === 0) continue;
      const startPct = (accumulated / total) * 100;
      accumulated += value;
      const endPct = (accumulated / total) * 100;
      segments.push(`#94A3B8 ${startPct}% ${endPct}%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  }, [data?.charts?.tasksByPriority]);

  // Build status bar data
  const statusBars = useMemo(() => {
    if (!data?.charts?.tasksByStatus) return [];

    const entries = Object.entries(data.charts.tasksByStatus);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    return entries.map(([status, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const isDone = status.toLowerCase() === 'done';
      return { status, count, pct, isDone };
    });
  }, [data?.charts?.tasksByStatus]);

  // Build trend chart SVG path
  const trendData = useMemo(() => {
    const trend = data?.charts?.taskCompletionTrend ?? [];
    if (trend.length === 0) return { linePath: '', areaPath: '', labels: [] };

    const maxCount = Math.max(...trend.map((t) => t.count), 1);
    const points = trend.map((t, i) => {
      const x = trend.length > 1 ? (i / (trend.length - 1)) * 100 : 50;
      const y = 40 - (t.count / maxCount) * 35;
      return { x, y };
    });

    const linePoints = points.map((p) => `${p.x},${p.y}`).join(' L');
    const linePath = `M${linePoints}`;
    const areaPath = `M0,40 L${linePoints} L100,40 Z`;

    const labels: string[] = [];
    if (trend.length >= 4) {
      const step = Math.floor(trend.length / 3);
      labels.push(trend[0]?.date ?? '');
      labels.push(trend[step]?.date ?? '');
      labels.push(trend[step * 2]?.date ?? '');
      labels.push(trend[trend.length - 1]?.date ?? '');
    } else {
      for (const t of trend) {
        labels.push(t.date);
      }
    }

    return { linePath, areaPath, labels, points };
  }, [data?.charts?.taskCompletionTrend]);

  const totalPriorityTasks = useMemo(() => {
    if (!data?.charts?.tasksByPriority) return 0;
    return Object.values(data.charts.tasksByPriority).reduce((sum, v) => sum + v, 0);
  }, [data?.charts?.tasksByPriority]);

  return (
    <div className="flex flex-col h-full">
      <MobileHeader
        title="Dashboard"
        onBack={() => navigate(`/projects/${projectId}/board`)}
      />

      <DataState<DashboardData>
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={fetchData}
        isEmpty={() => false}
      >
        {(dashData) => (
          <main className="flex-1 overflow-y-auto hide-scrollbar p-3 pb-6 flex flex-col gap-3">
            {/* Filter Bar */}
            <section className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Date Range */}
                <div className="flex items-center gap-1.5 h-9 bg-white border border-[#E5E7EB] rounded-md px-2.5 w-full">
                  <ClipboardList className="text-[#64748B] shrink-0 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Start"
                    className="w-full bg-transparent text-xs focus:outline-none text-[#1E293B] placeholder-[#94A3B8]"
                  />
                  <span className="text-[#94A3B8] text-xs">-</span>
                  <input
                    type="text"
                    placeholder="End"
                    className="w-full bg-transparent text-xs focus:outline-none text-[#1E293B] text-right placeholder-[#94A3B8]"
                  />
                </div>

                {/* Assignee */}
                <div className="relative h-9">
                  <select className="w-full h-full bg-white border border-[#E5E7EB] rounded-md px-2.5 text-xs text-[#1E293B] appearance-none focus:outline-none focus:border-[#4A90D9]">
                    <option>All members</option>
                    {(dashData.members ?? []).map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.userId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Chips */}
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_FILTER_OPTIONS.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setActivePriority(priority)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-medium transition-colors',
                      activePriority === priority
                        ? 'bg-[#4A90D9] text-white'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                    )}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-2 gap-2.5">
              {/* Total Tasks */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between h-[104px] relative shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#64748B]">Total Tasks</span>
                    <span className="text-2xl font-bold tracking-tight text-[#1E293B]">
                      {dashData.summary?.totalTasks ?? 0}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#4A90D9]/10 flex items-center justify-center text-[#4A90D9]">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[10px] text-[#10B981] flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% vs last month</span>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between h-[104px] shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#64748B]">Completed</span>
                    <span className="text-2xl font-bold tracking-tight text-[#10B981]">
                      {dashData.summary?.completedTasks ?? 0}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1 rounded-full mt-1">
                  <div
                    className="bg-[#10B981] h-1 rounded-full transition-all"
                    style={{ width: `${completedPct}%` }}
                  />
                </div>
              </div>

              {/* Overdue */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between h-[104px] shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#64748B]">Overdue</span>
                    <span className="text-2xl font-bold tracking-tight text-[#EF4444]">
                      {dashData.summary?.overdueTasks ?? 0}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                    <Bell className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[10px] text-[#64748B] mt-1">Requires attention</div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col items-center justify-center h-[104px] shadow-sm">
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `conic-gradient(#4A90D9 ${completionRate}%, #F1F5F9 0)` }}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-[#1E293B] leading-none">
                      {completionRate}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#64748B] mt-1.5">
                  Completion Rate
                </span>
              </div>
            </section>

            {/* Charts Stack */}
            <section className="flex flex-col gap-2.5">
              {/* Tasks by Status */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[#1E293B]">Tasks by Status</h4>
                  <button
                    type="button"
                    className="text-[#94A3B8] hover:text-[#64748B]"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {statusBars.map((item) => (
                    <div key={item.status} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-medium text-[#64748B] mb-1">
                        <span>{item.status}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            item.isDone ? 'bg-[#10B981]' : 'bg-[#4A90D9]'
                          )}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks by Priority */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm flex flex-row gap-3 items-center">
                <div className="flex-grow w-full">
                  <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Tasks by Priority</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(dashData.charts?.tasksByPriority ?? {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[key] ?? '#94A3B8' }}
                        />
                        <span className="text-xs text-[#64748B]">
                          {key.charAt(0) + key.slice(1).toLowerCase()} ({value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative w-24 h-24 flex-shrink-0">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: donutGradient }}
                  />
                  <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-[#1E293B]">{totalPriorityTasks}</span>
                      <span className="text-[10px] text-[#64748B] uppercase font-medium">
                        Tasks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Workload */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
                <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Member Workload</h4>

                <div className="flex flex-col gap-4">
                  {(dashData.members ?? []).map((member, index) => {
                    const colorScheme = getAvatarColor(index);
                    const initials = getInitials(member.userId);

                    return (
                      <div key={member.id} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            colorScheme.bg,
                            colorScheme.text
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-[#1E293B]">
                              {member.userId}
                            </span>
                            <span className="text-xs font-medium text-[#64748B]">
                              {member.projectRole}
                            </span>
                          </div>
                          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full">
                            <div
                              className="bg-[#4A90D9] h-1.5 rounded-full"
                              style={{ width: `${60 + index * 5}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completion Trend */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[#1E293B]">Completion Trend</h4>
                  <span className="text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded-md font-medium">
                    +8% this week
                  </span>
                </div>

                <div className="w-full h-40 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-[#94A3B8] pointer-events-none">
                    <div className="w-full border-b border-[#F1F5F9] h-0 flex items-end" />
                    <div className="w-full border-b border-[#F1F5F9] h-0 flex items-end" />
                    <div className="w-full border-b border-[#F1F5F9] h-0 flex items-end" />
                    <div className="w-full border-b border-[#E5E7EB] h-0 flex items-end" />
                  </div>

                  {/* SVG Chart */}
                  <svg
                    viewBox="0 0 100 40"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {trendData.areaPath ? (
                      <path d={trendData.areaPath} fill="#10B981" fillOpacity="0.1" />
                    ) : null}
                    {trendData.linePath ? (
                      <path
                        d={trendData.linePath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                    {(trendData.points ?? []).length > 0 ? (
                      <>
                        <circle
                          cx={(trendData.points ?? [])[Math.floor(((trendData.points ?? []).length - 1) / 2)]?.x ?? 50}
                          cy={(trendData.points ?? [])[Math.floor(((trendData.points ?? []).length - 1) / 2)]?.y ?? 20}
                          r="1.5"
                          fill="#FFFFFF"
                          stroke="#10B981"
                          strokeWidth="1"
                        />
                        <circle
                          cx={(trendData.points ?? [])[(trendData.points ?? []).length - 1]?.x ?? 100}
                          cy={(trendData.points ?? [])[(trendData.points ?? []).length - 1]?.y ?? 8}
                          r="1.5"
                          fill="#FFFFFF"
                          stroke="#10B981"
                          strokeWidth="1"
                        />
                      </>
                    ) : null}
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2 px-1">
                  {(trendData.labels ?? []).map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full h-12 shrink-0 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#64748B] hover:bg-[#F9FAFB] hover:text-[#1E293B] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </main>
        )}
      </DataState>
    </div>
  );
}
