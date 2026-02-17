import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '~/lib/utils';

import type { Task } from '~/types/task';

interface TaskCardProps {
  task: Task;
  isDone?: boolean;
  onClick: () => void;
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
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? 'bg-blue-500';
}

function getInitial(id: string): string {
  return (id?.charAt(0) ?? 'U').toUpperCase();
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

export default function TaskCard({ task, isDone = false, onClick }: TaskCardProps) {
  const priorityDotColor = isDone ? 'bg-gray-400' : (PRIORITY_DOT_COLORS[task.priority] ?? 'bg-gray-400');
  const labels = task.labels ?? [];
  const commentCount = task.commentCount ?? 0;
  const attachmentCount = task.attachmentCount ?? 0;
  const hasMetaBadges = commentCount > 0 || attachmentCount > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isDragging) onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow cursor-pointer group touch-manipulation',
        isDone && 'opacity-60 hover:opacity-100',
        isDragging && 'opacity-30 shadow-none'
      )}
    >
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

      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-4 mb-2">
          {labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium leading-none"
              style={{
                backgroundColor: `${label.color}1A`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {labels.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium leading-none text-[#94A3B8] bg-[#F1F5F9]">
              +{labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Avatar + Meta badges + Due Date */}
      <div className="flex items-center justify-between pl-4 mt-2">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
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

          {/* Comment & Attachment counts */}
          {hasMetaBadges && (
            <div className="flex items-center gap-1.5">
              {commentCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
                  <MessageSquare className="h-3 w-3" />
                  <span>{commentCount}</span>
                </div>
              )}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
                  <Paperclip className="h-3 w-3" />
                  <span>{attachmentCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Due date */}
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
