import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';

import { AlertCircle, ChevronDown } from 'lucide-react';

import DataState from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import { taskService } from '~/services/httpServices/taskService';

import type { Task } from '~/types/task';

const FILTER_OPTIONS = ['All', 'Overdue', 'Due Today', 'Due This Week'];
const SORT_OPTIONS = ['Due date', 'Priority', 'Project'];

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  URGENT: 'bg-[#EF4444]',
  HIGH: 'bg-[#F97316]',
  MEDIUM: 'bg-[#3B82F6]',
  LOW: 'bg-[#94A3B8]',
};

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  'To Do': 'bg-[#E0F2FE] text-[#0284C7]',
  'In Progress': 'bg-[#FEF3C7] text-[#D97706]',
  'Review': 'bg-[#F3E8FF] text-[#9333EA]',
  'Done': 'bg-[#D1FAE5] text-[#059669]',
};

function getStatusBadgeStyle(columnTitle?: string): string {
  if (!columnTitle) return 'bg-[#E0F2FE] text-[#0284C7]';
  return STATUS_BADGE_STYLES[columnTitle] ?? 'bg-[#F1F5F9] text-[#64748B]';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(task.dueDate);
  return due < today;
}

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Due date');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(() => {
    setIsLoading(true);
    setError(null);
    taskService
      .myTasks({ limit: 200 })
      .then((response) => setTasks(response?.data ?? []))
      .catch((err: unknown) => {
        const message =
          err != null && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to load tasks';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  const overdueCount = useMemo(
    () => (tasks ?? []).filter((t) => t.dueDate && new Date(t.dueDate) < today).length,
    [tasks, today.getTime()]
  );

  const filteredTasks = useMemo(() => {
    return (tasks ?? []).filter((t) => {
      if (filter === 'All') return true;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      if (filter === 'Overdue') return due < today;
      if (filter === 'Due Today') return due.toDateString() === today.toDateString();
      if (filter === 'Due This Week') return due >= today && due <= endOfWeek;
      return true;
    });
  }, [tasks, filter, today.getTime(), endOfWeek.getTime()]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    if (sortBy === 'Due date') {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'Priority') {
      sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    }
    // For 'Project', grouping handles the order
    return sorted;
  }, [filteredTasks, sortBy]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { name: string; tasks: Task[] }> = {};
    for (const task of sortedTasks) {
      const key = task.projectId ?? 'No Project';
      if (!groups[key]) {
        groups[key] = {
          name: task.project?.title ?? key,
          tasks: [],
        };
      }
      groups[key].tasks.push(task);
    }
    return groups;
  }, [sortedTasks]);

  const renderFilterChip = useCallback(
    (option: string) => {
      if (option === 'Overdue' && overdueCount > 0) {
        return (
          <span className="flex items-center gap-1.5">
            Overdue
            <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {overdueCount}
            </span>
          </span>
        );
      }
      return option;
    },
    [overdueCount]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center px-4 shrink-0 z-20">
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">My Tasks</h2>
      </header>

      {/* Filter & Sort Row */}
      <section className="z-10 bg-[#F9FAFB]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3 border-b border-[#E5E7EB]/50 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-grow pr-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = option === filter;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={cn(
                  'flex-shrink-0 h-[32px] px-[12px] rounded-2xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#4A90D9] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#64748B] border border-transparent hover:border-[#E5E7EB]'
                )}
              >
                {renderFilterChip(option)}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 pl-3 pr-8 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A90D9] shadow-sm appearance-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            size={14}
          />
        </div>
      </section>

      {/* Task List Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-[70px]">
        <DataState<Task[]>
          isLoading={isLoading}
          error={error}
          data={filteredTasks}
          onRetry={fetchTasks}
        >
          {(taskList) => (
            <>
              {Object.entries(groupedTasks).map(([projectId, group]) => (
                <div
                  key={projectId}
                  className="flex flex-col mt-4 rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm"
                >
                  {/* Group Header */}
                  <div className="bg-[#F1F5F9] px-4 py-3 border-l-[3px] border-[#4A90D9] flex items-center">
                    <h4 className="text-sm font-semibold text-[#1E293B] uppercase tracking-wider">
                      {projectId === 'No Project' ? 'Unassigned' : group.name}
                    </h4>
                  </div>

                  {/* Task Rows */}
                  <div className="flex flex-col bg-white">
                    {(group.tasks ?? []).map((task) => {
                      const overdue = isOverdue(task);
                      return (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/projects/${task.projectId}/tasks/${task.id}`);
                            }
                          }}
                          className={cn(
                            'group flex items-center gap-3 p-4 bg-white border-b border-[#E5E7EB] border-l-[3px] hover:bg-[#F8FAFC] transition-colors cursor-pointer',
                            overdue ? 'border-l-[#EF4444]' : 'border-l-transparent'
                          )}
                        >
                          {/* Priority Dot */}
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
                              PRIORITY_COLORS[task.priority]
                            )}
                          />

                          <div className="flex flex-col flex-grow min-w-0 gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-medium text-[#1E293B] truncate">
                                {task.title}
                              </span>
                              {task.dueDate ? (
                                overdue ? (
                                  <span className="text-xs font-bold text-[#EF4444] whitespace-nowrap flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {formatDate(task.dueDate)}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-[#64748B] whitespace-nowrap">
                                    {formatDate(task.dueDate)}
                                  </span>
                                )
                              ) : null}
                            </div>
                            <div className="flex items-center">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold',
                                getStatusBadgeStyle(task.column?.title)
                              )}>
                                {task.column?.title ?? 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </DataState>
      </main>
    </div>
  );
}
