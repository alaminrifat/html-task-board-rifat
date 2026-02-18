import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useAuth } from '~/hooks/useAuth';
import { projectService } from '~/services/httpServices/projectService';
import { columnService } from '~/services/httpServices/columnService';
import { taskService } from '~/services/httpServices/taskService';
import { memberService } from '~/services/httpServices/memberService';
import { io } from 'socket.io-client';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';

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
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag-and-drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const tasksSnapshotRef = useRef<Task[] | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // WIP limit warning dialog
  const [wipWarning, setWipWarning] = useState<{
    taskId: string;
    targetColumnId: string;
    position: number;
    columnTitle: string;
    wipLimit: number;
    finalTasks: Task[];
  } | null>(null);

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

  // --- WebSocket real-time sync ---
  const wsBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    // Strip /api suffix to get base URL for socket.io namespace
    return apiUrl.replace(/\/api\/?$/, '');
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const socket = io(`${wsBaseUrl}/board`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinProject', { projectId });
    });

    socket.on('taskMoved', (data: { task: Task; fromColumnId: string; toColumnId: string; position: number }) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === data.task.id ? { ...t, columnId: data.toColumnId, position: data.position } : t
          ),
        };
      });
    });

    socket.on('taskCreated', (data: { task: Task }) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        // Avoid duplicates
        if (prev.tasks.some((t) => t.id === data.task.id)) return prev;
        return { ...prev, tasks: [...prev.tasks, data.task] };
      });
    });

    socket.on('taskUpdated', (data: { task: Task }) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t)),
        };
      });
    });

    socket.on('taskDeleted', (data: { taskId: string }) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: prev.tasks.filter((t) => t.id !== data.taskId) };
      });
    });

    socket.on('boardRefresh', () => {
      fetchBoard();
    });

    socket.on('columnUpdated', () => {
      fetchBoard();
    });

    return () => {
      socket.emit('leaveProject', { projectId });
      socket.disconnect();
    };
  }, [projectId, wsBaseUrl, fetchBoard]);

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
  const isOwner = (boardData?.members ?? []).some(
    (m) => m.userId === user?.id && m.projectRole === 'OWNER'
  );

  // Count overdue tasks (past due date and not in done column)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.columnId === doneColumnId) return false;
    return new Date(t.dueDate) < today;
  }).length;

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

      // Check WIP limit before moving (cross-column only)
      if (sourceColumnId && sourceColumnId !== targetColumnId) {
        const targetColumn = (boardData.columns ?? []).find((c) => c.id === targetColumnId);
        if (targetColumn?.wipLimit && targetColumn.wipLimit > 0) {
          const currentCountInTarget = tasksInTarget.length; // tasks already in target (excluding moved task)
          if (currentCountInTarget >= targetColumn.wipLimit) {
            // Show warning dialog — keep optimistic state but defer API call
            setBoardData((prev) => (prev ? { ...prev, tasks: finalTasks } : prev));
            setWipWarning({
              taskId: activeTaskId,
              targetColumnId,
              position: newPosition,
              columnTitle: targetColumn.title,
              wipLimit: targetColumn.wipLimit,
              finalTasks,
            });
            return; // Don't clear snapshot yet — need it for revert if cancelled
          }
        }
      }

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

  // WIP warning dialog handlers
  const handleWipConfirm = useCallback(async () => {
    if (!wipWarning || !projectId) return;
    setBoardData((prev) => (prev ? { ...prev, tasks: wipWarning.finalTasks } : prev));
    setWipWarning(null);
    try {
      await taskService.move(projectId, wipWarning.taskId, {
        columnId: wipWarning.targetColumnId,
        position: wipWarning.position,
      });
    } catch (err: unknown) {
      if (tasksSnapshotRef.current) {
        setBoardData((prev) =>
          prev ? { ...prev, tasks: tasksSnapshotRef.current! } : prev
        );
      }
      const message = (err as { message?: string })?.message ?? 'Failed to move task';
      showToast(message);
    } finally {
      tasksSnapshotRef.current = null;
    }
  }, [wipWarning, projectId, showToast]);

  const handleWipCancel = useCallback(() => {
    setWipWarning(null);
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
        isOwner={isOwner}
        overdueCount={boardData ? overdueCount : undefined}
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
                sensors={isOffline ? [] : sensors}
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
                          onAddTask={isOffline ? undefined : () => handleAddTask(column.id)}
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
              {addingToColumn && !isOffline && (
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
      {/* WIP Limit Warning Dialog */}
      {wipWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-[#1E293B] mb-2">WIP Limit Exceeded</h3>
            <p className="text-sm text-[#64748B] mb-5">
              Column &quot;{wipWarning.columnTitle}&quot; has a WIP limit of{' '}
              <span className="font-medium text-[#1E293B]">{wipWarning.wipLimit}</span> tasks and is already at capacity.
              Do you still want to move this task?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleWipCancel}
                className="px-4 py-2 text-sm font-medium text-[#64748B] border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWipConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F59E0B] rounded-lg hover:bg-[#D97706] transition-colors"
              >
                Move Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#EF4444] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
