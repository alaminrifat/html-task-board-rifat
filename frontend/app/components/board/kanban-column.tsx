import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import TaskCard from '~/components/board/task-card';
import { cn } from '~/lib/utils';

import type { Column } from '~/types/column';
import type { Task } from '~/types/task';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onAddTask?: () => void;
  isDoneColumn?: boolean;
}

export default function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  isDoneColumn = false,
}: KanbanColumnProps) {
  const taskCount = (tasks ?? []).length;
  const hasWipLimit = column.wipLimit != null && column.wipLimit > 0;
  const isOverWipLimit = hasWipLimit && taskCount >= (column.wipLimit ?? 0);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  const taskIds = (tasks ?? []).map((t) => t.id);

  return (
    <div
      className={cn(
        'w-[260px] h-full flex flex-col bg-[#F1F5F9] rounded-xl p-2.5 shrink-0 transition-colors',
        isOver && 'bg-[#E2E8F0] ring-2 ring-[#4A90D9]/30',
        isOver && isOverWipLimit && 'ring-[#EF4444]/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1E293B]">{column.title}</span>
          <span className="bg-[#94A3B8] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {taskCount}
          </span>
          {hasWipLimit ? (
            <span className={cn(
              'text-[10px] font-medium',
              isOverWipLimit ? 'text-[#EF4444]' : 'text-[#94A3B8]'
            )}>
              {taskCount}/{column.wipLimit}
            </span>
          ) : null}
        </div>
        {onAddTask ? (
          <button
            type="button"
            onClick={onAddTask}
            className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#4A90D9] transition-colors"
            aria-label={`Add task to ${column.title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Cards Container */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2.5 min-h-[40px]">
          {(tasks ?? []).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDone={isDoneColumn}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
