import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

import ProjectHeader from '~/components/layout/project-header';
import KanbanColumn from '~/components/board/kanban-column';
import TaskCardOverlay from '~/components/board/task-card-overlay';
import DataState from '~/components/ui/empty-state';
import { projectService } from '~/services/httpServices/projectService';
import { columnService } from '~/services/httpServices/columnService';
import { taskService } from '~/services/httpServices/taskService';
import { memberService } from '~/services/httpServices/memberService';

import type { Project } from '~/types/project';
import type { Column } from '~/types/column';
import type { Task } from '~/types/task';
import type { ProjectMember } from '~/types/member';

interface BoardData {
  project: Project;
  columns: Column[];
  tasks: Task[];
  members: ProjectMember[];
}

export default function Board() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag-and-drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const tasksSnapshotRef = useRef<Task[] | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchBoard = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [projectData, columnsData, tasksResponse, membersData] = await Promise.all([
        projectService.getById(projectId),
        columnService.list(projectId),
        taskService.list(projectId, { limit: 200 }),
        memberService.list(projectId).catch(() => []),
      ]);

      setBoardData({
        project: projectData,
        columns: (columnsData ?? []).sort((a, b) => a.position - b.position),
        tasks: tasksResponse?.data ?? [],
        members: membersData ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load board';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
    },
    [navigate, projectId]
  );

  const handleAddTask = useCallback((columnId: string) => {
    setAddingToColumn(columnId);
    setNewTaskTitle('');
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!projectId || !addingToColumn || !newTaskTitle.trim()) return;
    try {
      setIsCreatingTask(true);
      const newTask = await taskService.create(projectId, {
        title: newTaskTitle.trim(),
        columnId: addingToColumn,
      });
      if (newTask) {
        setBoardData((prev) => {
          if (!prev) return prev;
          return { ...prev, tasks: [...prev.tasks, newTask] };
        });
      }
      setAddingToColumn(null);
      setNewTaskTitle('');
    } catch {
      // Silently fail
    } finally {
      setIsCreatingTask(false);
    }
  }, [projectId, addingToColumn, newTaskTitle]);

  // Calculate progress from done column
  const columns = boardData?.columns ?? [];
  const tasks = boardData?.tasks ?? [];
  const doneColumnId = columns.length > 0 ? columns[columns.length - 1]?.id : null;
  const doneTasks = doneColumnId ? tasks.filter((t) => t.columnId === doneColumnId).length : 0;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // --- Drag-and-drop ---

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = (boardData?.tasks ?? []).find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
        tasksSnapshotRef.current = boardData?.tasks ?? [];
      }
    },
    [boardData]
  );

  const resolveColumnId = useCallback(
    (overId: string, currentTasks: Task[]): string | null => {
      const overTask = currentTasks.find((t) => t.id === overId);
      if (overTask) return overTask.columnId;
      // Check if overId is a column droppable
      if (overId.startsWith('column-')) return overId.replace('column-', '');
      return null;
    },
    []
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !boardData) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      const currentTask = boardData.tasks.find((t) => t.id === activeTaskId);
      if (!currentTask) return;

      const targetColumnId = resolveColumnId(overId, boardData.tasks);
      if (!targetColumnId || currentTask.columnId === targetColumnId) return;

      // Optimistically move card to target column during drag
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === activeTaskId ? { ...t, columnId: targetColumnId } : t
          ),
        };
      });
    },
    [boardData, resolveColumnId]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !boardData || !projectId) {
        // Cancelled — revert
        if (tasksSnapshotRef.current) {
          setBoardData((prev) =>
            prev ? { ...prev, tasks: tasksSnapshotRef.current! } : prev
          );
        }
        tasksSnapshotRef.current = null;
        return;
      }

      const activeTaskId = active.id as string;
      const overId = over.id as string;
      const currentTasks = boardData.tasks;

      const movedTask = currentTasks.find((t) => t.id === activeTaskId);
      if (!movedTask) {
        tasksSnapshotRef.current = null;
        return;
      }

      // Determine target column
      const targetColumnId = resolveColumnId(overId, currentTasks) ?? movedTask.columnId;

      // Compute new position within target column
      const tasksInTarget = currentTasks
        .filter((t) => t.columnId === targetColumnId && t.id !== activeTaskId)
        .sort((a, b) => a.position - b.position);

      let newPosition: number;
      const overTask = currentTasks.find((t) => t.id === overId);
      if (overTask && overTask.id !== activeTaskId) {
        const overIndex = tasksInTarget.findIndex((t) => t.id === overTask.id);
        newPosition = overIndex >= 0 ? overIndex : tasksInTarget.length;
      } else {
        newPosition = tasksInTarget.length;
      }

      // Check if anything actually changed
      const originalTask = tasksSnapshotRef.current?.find((t) => t.id === activeTaskId);
      if (
        originalTask &&
        originalTask.columnId === targetColumnId &&
        originalTask.position === newPosition
      ) {
        // No change — revert any intermediate state
        if (tasksSnapshotRef.current) {
          setBoardData((prev) =>
            prev ? { ...prev, tasks: tasksSnapshotRef.current! } : prev
          );
        }
        tasksSnapshotRef.current = null;
        return;
      }

      // Build optimistic state with correct positions
      const reorderedTarget = [...tasksInTarget];
      reorderedTarget.splice(newPosition, 0, {
        ...movedTask,
        columnId: targetColumnId,
      });

      const positionMap = new Map<string, { position: number; columnId: string }>();
      reorderedTarget.forEach((t, i) =>
        positionMap.set(t.id, { position: i, columnId: targetColumnId })
      );

      // Reindex source column if cross-column move
      const sourceColumnId = originalTask?.columnId;
      if (sourceColumnId && sourceColumnId !== targetColumnId) {
        const sourceTasks = currentTasks
          .filter((t) => t.columnId === sourceColumnId && t.id !== activeTaskId)
          .sort((a, b) => a.position - b.position);
        sourceTasks.forEach((t, i) =>
          positionMap.set(t.id, { position: i, columnId: sourceColumnId })
        );
      }

      const finalTasks = currentTasks.map((t) => {
        const update = positionMap.get(t.id);
        if (update) return { ...t, ...update };
        return t;
      });

      setBoardData((prev) => (prev ? { ...prev, tasks: finalTasks } : prev));

      // API call
      try {
        await taskService.move(projectId, activeTaskId, {
          columnId: targetColumnId,
          position: newPosition,
        });
      } catch (err: unknown) {
        // Revert to snapshot
        if (tasksSnapshotRef.current) {
          setBoardData((prev) =>
            prev ? { ...prev, tasks: tasksSnapshotRef.current! } : prev
          );
        }
        const message =
          (err as { message?: string })?.message ?? 'Failed to move task';
        showToast(
          message.toLowerCase().includes('wip limit')
            ? message
            : 'Failed to move task. Please try again.'
        );
      } finally {
        tasksSnapshotRef.current = null;
      }
    },
    [boardData, projectId, resolveColumnId, showToast]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    if (tasksSnapshotRef.current) {
      setBoardData((prev) =>
        prev ? { ...prev, tasks: tasksSnapshotRef.current! } : prev
      );
    }
    tasksSnapshotRef.current = null;
  }, []);

  // Determine if active task is in the done column (for overlay styling)
  const lastColumnId =
    columns.length > 0 ? columns[columns.length - 1]?.id : null;

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <ProjectHeader
        projectTitle={boardData?.project?.title ?? 'Loading...'}
        activeTab="board"
        projectId={projectId ?? ''}
        progress={boardData ? progress : undefined}
        members={boardData?.members?.map((m) => ({
          userId: m.userId,
          fullName: m.user?.fullName,
          avatarUrl: m.user?.avatarUrl,
        }))}
      />

      {/* Board Canvas */}
      <DataState<BoardData>
        isLoading={isLoading}
        error={error}
        data={boardData}
        onRetry={fetchBoard}
        isEmpty={(data) => (data.columns ?? []).length === 0}
        emptyComponent={
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <p className="text-sm text-[#64748B]">No columns yet. Add columns in project settings.</p>
          </div>
        }
      >
        {(data) => {
          const sortedColumns = data.columns ?? [];
          const allTasks = data.tasks ?? [];

          return (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <main className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar">
                  <div className="h-full flex p-3 gap-3 min-w-max">
                    {sortedColumns.map((column) => {
                      const columnTasks = allTasks
                        .filter((t) => t.columnId === column.id)
                        .sort((a, b) => a.position - b.position);

                      return (
                        <KanbanColumn
                          key={column.id}
                          column={column}
                          tasks={columnTasks}
                          onTaskClick={handleTaskClick}
                          onAddTask={() => handleAddTask(column.id)}
                          isDoneColumn={column.id === lastColumnId}
                        />
                      );
                    })}
                  </div>
                </main>

                <DragOverlay dropAnimation={null}>
                  {activeTask ? (
                    <TaskCardOverlay
                      task={activeTask}
                      isDone={activeTask.columnId === lastColumnId}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Quick Add Task */}
              {addingToColumn && (
                <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-3 z-20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTask();
                        if (e.key === 'Escape') setAddingToColumn(null);
                      }}
                      placeholder="Task title..."
                      autoFocus
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#4A90D9]"
                      disabled={isCreatingTask}
                    />
                    <button
                      type="button"
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle.trim() || isCreatingTask}
                      className="h-10 px-4 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] disabled:opacity-50 transition-colors"
                    >
                      {isCreatingTask ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingToColumn(null)}
                      className="h-10 px-3 border border-[#E5E7EB] text-[#64748B] text-sm rounded-lg hover:bg-[#F9FAFB] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </DataState>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#EF4444] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
