import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ProjectHeader from '~/components/layout/project-header';
import DataState from '~/components/ui/empty-state';
import { projectService } from '~/services/httpServices/projectService';
import { dashboardService } from '~/services/httpServices/dashboardService';
import { cn } from '~/lib/utils';

import type { Project } from '~/types/project';
import type { CalendarEvent } from '~/services/httpServices/dashboardService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-[#EF4444]',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-[#94A3B8]',
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

function getCalendarDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const endPadding = 6 - lastDay.getDay();

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false, isToday: false, events: [] });
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = (events ?? []).filter((e) => {
      if (!e.dueDate) return false;
      return e.dueDate.startsWith(dateStr);
    });

    days.push({ date, isCurrentMonth: true, isToday, events: dayEvents });
  }

  // Next month padding
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i);
    days.push({ date, isCurrentMonth: false, isToday: false, events: [] });
  }

  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const MAX_VISIBLE_EVENTS = 2;

export default function Calendar() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [projectData, calendarData] = await Promise.all([
        projectService.getById(projectId),
        dashboardService.calendar(projectId, {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        }),
      ]);

      setProject(projectData);
      setEvents(calendarData ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load calendar';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentDate.getFullYear(), currentDate.getMonth(), events),
    [currentDate, events]
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleEventClick = useCallback(
    (taskId: string) => {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
    },
    [navigate, projectId]
  );

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader
        projectTitle={project?.title ?? 'Loading...'}
        activeTab="calendar"
        projectId={projectId ?? ''}
      />

      {/* Calendar Controls */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5E7EB] bg-white shrink-0">
        {/* View Toggle */}
        <div className="bg-[#F1F5F9] p-0.5 rounded-lg flex items-center h-[28px]">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={cn(
              'px-2.5 h-full flex items-center justify-center text-[10px] font-medium rounded-md',
              viewMode === 'week'
                ? 'text-[#4A90D9] bg-white shadow-sm'
                : 'text-[#64748B] hover:text-[#1E293B]'
            )}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={cn(
              'px-2.5 h-full flex items-center justify-center text-[10px] font-medium rounded-md',
              viewMode === 'month'
                ? 'text-[#4A90D9] bg-white shadow-sm'
                : 'text-[#64748B] hover:text-[#1E293B]'
            )}
          >
            Month
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="text-[#64748B] hover:text-[#1E293B] p-0.5"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <span className="text-sm font-semibold tracking-tight text-[#1E293B]">
            {formatMonthYear(currentDate)}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="text-[#64748B] hover:text-[#1E293B] p-0.5"
            aria-label="Next month"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <DataState<CalendarEvent[]>
        isLoading={isLoading}
        error={error}
        data={events}
        onRetry={fetchData}
        isEmpty={() => false}
      >
        {() => (
          <main className="flex-1 overflow-y-auto flex flex-col bg-white">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[10px] font-medium text-[#64748B]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1">
              {calendarDays.map((day, index) => {
                const visibleEvents = (day.events ?? []).slice(0, MAX_VISIBLE_EVENTS);
                const remainingCount = Math.max(0, (day.events ?? []).length - MAX_VISIBLE_EVENTS);

                return (
                  <div
                    key={index}
                    className={cn(
                      'border-b border-r border-[#E5E7EB] p-1 min-h-[72px] flex flex-col gap-1 transition-colors',
                      day.isToday ? 'bg-[#F0F7FF]' : 'hover:bg-[#F8FAFC]'
                    )}
                  >
                    {/* Date Number */}
                    {day.isToday ? (
                      <div className="w-5 h-5 rounded-full bg-[#4A90D9] flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-semibold text-white">
                          {day.date.getDate()}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          'text-xs font-medium',
                          day.isCurrentMonth ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                    )}

                    {/* Task Bars */}
                    {visibleEvents.map((event) => (
                      <button
                        key={event.taskId}
                        type="button"
                        onClick={() => handleEventClick(event.taskId)}
                        className={cn(
                          'h-4 w-full rounded px-1.5 flex items-center cursor-pointer hover:opacity-90',
                          PRIORITY_COLORS[event.priority?.toUpperCase()] ?? 'bg-[#94A3B8]'
                        )}
                      >
                        <span className="text-[10px] font-medium text-white truncate">
                          {event.title}
                        </span>
                      </button>
                    ))}

                    {/* More link */}
                    {remainingCount > 0 ? (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-[#4A90D9] hover:underline text-left pl-0.5"
                      >
                        +{remainingCount} more
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </main>
        )}
      </DataState>
    </div>
  );
}
