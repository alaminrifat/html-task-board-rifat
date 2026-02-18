import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  UserPlus,
  FolderPlus,
  AlertCircle,
  ArrowRight,
  MoreHorizontal,
  FileEdit,
} from 'lucide-react';
import { Breadcrumb } from '~/components/shared/breadcrumb';
import { StatsCard } from '~/components/shared/stats-card';
import { Skeleton } from '~/components/shared/skeleton';
import { adminDashboardService } from '~/services/httpServices/adminDashboardService';
import type {
  DashboardStats,
  DashboardCharts,
  ChartDataPoint,
  RecentActivity,
} from '~/types/admin';

// ---------------------------------------------------------------------------
// Period filter options
// ---------------------------------------------------------------------------
type Period = 'today' | '7d' | '30d' | 'custom';

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

// ---------------------------------------------------------------------------
// Activity type -> icon / color map
// ---------------------------------------------------------------------------
const ACTIVITY_ICON_MAP: Record<
  RecentActivity['type'],
  { icon: React.ReactNode; bg: string; color: string }
> = {
  USER_CREATED: {
    icon: <UserPlus className="w-4 h-4" />,
    bg: 'bg-blue-50',
    color: 'text-[#4A90D9]',
  },
  PROJECT_CREATED: {
    icon: <FolderPlus className="w-4 h-4" />,
    bg: 'bg-emerald-50',
    color: 'text-[#10B981]',
  },
  TASK_COMPLETED: {
    icon: <ClipboardCheck className="w-4 h-4" />,
    bg: 'bg-purple-50',
    color: 'text-[#8B5CF6]',
  },
  USER_SUSPENDED: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-orange-50',
    color: 'text-[#F59E0B]',
  },
};

// ---------------------------------------------------------------------------
// Inline SVG Chart Components
// ---------------------------------------------------------------------------

function LineChart({ data, color = '#4A90D9' }: { data: ChartDataPoint[]; color?: string }) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return <ChartPlaceholder label="No data available" />;
  }

  const vW = 400;
  const vH = 200;
  const padX = 40;
  const padY = 20;
  const innerW = vW - padX * 2;
  const innerH = vH - padY * 2;

  const max = Math.max(...safeData.map((p) => p.value), 1);
  const stepX = innerW / Math.max(safeData.length - 1, 1);

  const pathD = safeData
    .map((p, i) => {
      const x = padX + i * stepX;
      const y = padY + innerH - (p.value / max) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  // Grid lines (4 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padY + (innerH / 4) * i;
    return y;
  });

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {gridLines.map((y) => (
        <line
          key={y}
          x1={padX}
          y1={y}
          x2={vW - padX}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="0.5"
        />
      ))}
      {/* Y-axis labels */}
      {gridLines.map((y, i) => (
        <text
          key={`label-${y}`}
          x={padX - 6}
          y={y + 3}
          textAnchor="end"
          fill="#94A3B8"
          fontSize="8"
        >
          {Math.round(max - (max / 4) * i)}
        </text>
      ))}
      {/* X-axis labels */}
      {safeData.map((p, i) => {
        // Show every other label if too many
        if (safeData.length > 8 && i % 2 !== 0) return null;
        const x = padX + i * stepX;
        return (
          <text
            key={`x-${i}`}
            x={x}
            y={vH - 2}
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="7"
          >
            {p.label}
          </text>
        );
      })}
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Dots */}
      {safeData.map((p, i) => {
        const x = padX + i * stepX;
        const y = padY + innerH - (p.value / max) * innerH;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
        );
      })}
    </svg>
  );
}

function BarChart({ data, color = '#10B981' }: { data: ChartDataPoint[]; color?: string }) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return <ChartPlaceholder label="No data available" />;
  }

  const vW = 400;
  const vH = 200;
  const padX = 40;
  const padY = 20;
  const innerW = vW - padX * 2;
  const innerH = vH - padY * 2;

  const max = Math.max(...safeData.map((p) => p.value), 1);
  const barGap = 8;
  const barWidth = (innerW - barGap * (safeData.length - 1)) / safeData.length;

  // Grid lines (4 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padY + (innerH / 4) * i;
    return y;
  });

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {gridLines.map((y) => (
        <line
          key={y}
          x1={padX}
          y1={y}
          x2={vW - padX}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="0.5"
        />
      ))}
      {/* Y-axis labels */}
      {gridLines.map((y, i) => (
        <text
          key={`label-${y}`}
          x={padX - 6}
          y={y + 3}
          textAnchor="end"
          fill="#94A3B8"
          fontSize="8"
        >
          {Math.round(max - (max / 4) * i)}
        </text>
      ))}
      {/* Bars */}
      {safeData.map((p, i) => {
        const x = padX + i * (barWidth + barGap);
        const barH = (p.value / max) * innerH;
        const y = padY + innerH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx="2"
              fill={color}
              opacity="0.85"
            >
              <title>
                {p.label}: {p.value}
              </title>
            </rect>
            {/* X-axis label */}
            <text
              x={x + barWidth / 2}
              y={vH - 2}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="7"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({ data, color = '#8B5CF6' }: { data: ChartDataPoint[]; color?: string }) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return <ChartPlaceholder label="No data available" />;
  }

  const vW = 400;
  const vH = 200;
  const padX = 40;
  const padY = 20;
  const innerW = vW - padX * 2;
  const innerH = vH - padY * 2;

  const max = Math.max(...safeData.map((p) => p.value), 1);
  const stepX = innerW / Math.max(safeData.length - 1, 1);

  const points = safeData.map((p, i) => ({
    x: padX + i * stepX,
    y: padY + innerH - (p.value / max) * innerH,
  }));

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${(padY + innerH).toFixed(2)} L${padX},${(padY + innerH).toFixed(2)} Z`;

  // Grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => padY + (innerH / 4) * i);

  const gradientId = `area-gradient-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {gridLines.map((y) => (
        <line
          key={y}
          x1={padX}
          y1={y}
          x2={vW - padX}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="0.5"
        />
      ))}
      {/* Y-axis labels */}
      {gridLines.map((y, i) => (
        <text
          key={`label-${y}`}
          x={padX - 6}
          y={y + 3}
          textAnchor="end"
          fill="#94A3B8"
          fontSize="8"
        >
          {Math.round(max - (max / 4) * i)}
        </text>
      ))}
      {/* X-axis labels */}
      {safeData.map((p, i) => {
        if (safeData.length > 8 && i % 2 !== 0) return null;
        const x = padX + i * stepX;
        return (
          <text
            key={`x-${i}`}
            x={x}
            y={vH - 2}
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="7"
          >
            {p.label}
          </text>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Dots */}
      {points.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-sm text-[#94A3B8]">
      <BarChart3 className="w-5 h-5 mr-2 opacity-50" />
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top 5 Active Projects (progress bar list)
// ---------------------------------------------------------------------------
function TopProjectsList({ data }: { data: ChartDataPoint[] }) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return <ChartPlaceholder label="No project data available" />;
  }

  const max = Math.max(...safeData.map((p) => p.value), 1);

  return (
    <div className="flex flex-col gap-4 h-full justify-center px-1">
      {safeData.slice(0, 5).map((project, i) => {
        const percent = Math.round((project.value / max) * 100);
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1E293B] font-medium truncate max-w-[200px]">
                {project.label}
              </span>
              <span className="text-[#64748B] text-xs shrink-0 ml-2">
                {project.value} tasks
              </span>
            </div>
            <div className="w-full bg-[#F1F5F9] rounded-full h-2">
              <div
                className="h-2 rounded-full bg-[#F59E0B] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function ChartsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 h-72"
        >
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ActivityTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
      <div className="p-5 border-b border-[#E5E7EB]">
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-64 mb-1.5" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timestamp formatter
// ---------------------------------------------------------------------------
function formatRelativeTime(dateString: string): string {
  if (typeof window === 'undefined') return dateString;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Charts
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Recent Activity
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch stats & charts (depend on period)
  // ---------------------------------------------------------------------------
  const fetchStatsAndCharts = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    setChartsLoading(true);
    setChartsError(null);

    const params: { period: string; dateFrom?: string; dateTo?: string } = { period };
    if (period === 'custom' && dateFrom) params.dateFrom = dateFrom;
    if (period === 'custom' && dateTo) params.dateTo = dateTo;

    try {
      const data = await adminDashboardService.getStats(params);
      setStats(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }

    try {
      const data = await adminDashboardService.getCharts(params);
      setCharts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load charts';
      setChartsError(message);
    } finally {
      setChartsLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  // ---------------------------------------------------------------------------
  // Fetch recent activity (independent of period)
  // ---------------------------------------------------------------------------
  const fetchActivity = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const data = await adminDashboardService.getRecentActivity();
      setActivities(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load activity';
      setActivitiesError(message);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatsAndCharts();
  }, [fetchStatsAndCharts]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Dashboard' }]} />
          <h1 className="text-2xl font-bold text-[#1E293B]">Overview</h1>
        </div>

        {/* Period Filter Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1 shadow-sm">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === opt.value
                    ? 'bg-[#4A90D9] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-[34px] px-3 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
              />
              <span className="text-sm text-[#64748B]">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-[34px] px-3 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <StatsGridSkeleton />
      ) : statsError ? (
        <ErrorBanner message={statsError} onRetry={fetchStatsAndCharts} />
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-[#4A90D9]"
            subtitle={
              <>
                <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#10B981] font-medium">+{stats.newUsersThisWeek}</span>
                <span className="text-[#64748B]">new this week</span>
              </>
            }
          />
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<FolderOpen className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-[#10B981]"
            subtitle={
              <span className="text-[#64748B]">{stats.activeProjects} active projects</span>
            }
          />
          <StatsCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon={<ClipboardCheck className="w-5 h-5" />}
            iconBg="bg-purple-50"
            iconColor="text-[#8B5CF6]"
            subtitle={
              <>
                <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#10B981] font-medium">+{stats.completedThisWeek}</span>
                <span className="text-[#64748B]">completed this week</span>
              </>
            }
          />
          <StatsCard
            title="Active Today"
            value={stats.activeUsersToday}
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-orange-50"
            iconColor="text-[#F59E0B]"
            subtitle={
              <span className="text-[#64748B]">Users logged in past 24h</span>
            }
          />
        </div>
      ) : null}

      {/* Charts Grid */}
      {chartsLoading ? (
        <ChartsGridSkeleton />
      ) : chartsError ? (
        <ErrorBanner message={chartsError} onRetry={fetchStatsAndCharts} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* User Registration Trend */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 h-72 flex flex-col">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">User Registration Trend</h3>
            <div className="flex-1 min-h-0">
              <LineChart data={charts?.userGrowth ?? []} color="#4A90D9" />
            </div>
          </div>

          {/* Project Creation Trend */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 h-72 flex flex-col">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Project Creation Trend</h3>
            <div className="flex-1 min-h-0">
              <BarChart data={charts?.projectActivity ?? []} color="#10B981" />
            </div>
          </div>

          {/* Task Completion Rate */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 h-72 flex flex-col">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Task Completion Rate</h3>
            <div className="flex-1 min-h-0">
              <AreaChart data={charts?.taskCompletion ?? []} color="#8B5CF6" />
            </div>
          </div>

          {/* Top 5 Active Projects */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 h-72 flex flex-col">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Top 5 Active Projects</h3>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TopProjectsList data={charts?.projectActivity ?? []} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activitiesLoading ? (
        <ActivityTableSkeleton />
      ) : activitiesError ? (
        <ErrorBanner message={activitiesError} onRetry={fetchActivity} />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1E293B]">Recent Activity</h3>
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Activity list */}
          {(activities ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileEdit className="w-10 h-10 text-[#94A3B8] mb-2" />
              <p className="text-sm text-[#64748B]">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {(activities ?? []).map((activity) => {
                const iconMeta = ACTIVITY_ICON_MAP[activity.type] ?? {
                  icon: <FileEdit className="w-4 h-4" />,
                  bg: 'bg-gray-50',
                  color: 'text-[#64748B]',
                };
                return (
                  <div
                    key={activity.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-[#F9FAFB] transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconMeta.bg} ${iconMeta.color}`}
                    >
                      {iconMeta.icon}
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1E293B]">
                        <span className="font-medium">{activity.actorName}</span>{' '}
                        <span className="text-[#64748B]">{activity.description}</span>
                      </p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-[#94A3B8] shrink-0">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {(activities ?? []).length > 0 && (
            <div className="px-5 py-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                className="text-sm font-medium text-[#4A90D9] hover:text-[#3A7BC8] transition-colors flex items-center gap-1.5"
              >
                View All Activity
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error Banner
// ---------------------------------------------------------------------------
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
        <p className="text-sm text-[#EF4444]">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-[#EF4444] hover:text-red-700 transition-colors underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
