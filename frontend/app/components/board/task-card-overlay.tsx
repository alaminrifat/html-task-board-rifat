import { Calendar } from 'lucide-react';

import { cn } from '~/lib/utils';

import type { Task } from '~/types/task';

interface TaskCardOverlayProps {
  task: Task;
  isDone?: boolean;
}

const PRIORITY_DOT_COLORS: Record<Task['priority'], string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-[#4A90D9]',
  LOW: 'bg-gray-400',
};

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-amber-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-blue-500';
}

function getInitial(id: string): string {
  return (id?.charAt(0) ?? 'U').toUpperCase();
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}`;
}

export default function TaskCardOverlay({ task, isDone = false }: TaskCardOverlayProps) {
  const priorityDotColor = isDone ? 'bg-gray-400' : (PRIORITY_DOT_COLORS[task.priority] ?? 'bg-gray-400');

  return (
    <div className="bg-white p-3 rounded-lg border border-[#4A90D9] shadow-xl w-[236px] rotate-[2deg] cursor-grabbing">
      {/* Priority dot + Title */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', priorityDotColor)} />
        <h4
          className={cn(
            'text-sm font-medium text-[#1E293B] leading-snug',
            isDone && 'line-through'
          )}
        >
          {task.title}
        </h4>
      </div>

      {/* Footer: Avatar + Due Date */}
      <div className="flex items-center justify-between pl-4 mt-2">
        {task.assigneeId ? (
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0',
              getAvatarColor(task.assigneeId)
            )}
          >
            {getInitial(task.assigneeId)}
          </div>
        ) : (
          <div className="w-5 h-5" />
        )}

        {task.dueDate ? (
          <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
            <Calendar className="h-3 w-3" />
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
