import { create } from 'zustand';
import type { Task } from '~/types/task';
import type { Column } from '~/types/column';

interface BoardState {
  columns: Column[];
  tasks: Record<string, Task[]>; // columnId -> tasks
  isLoading: boolean;

  setBoard: (columns: Column[], tasks: Record<string, Task[]>) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string, columnId: string) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newPosition: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  columns: [],
  tasks: {},
  isLoading: false,

  setBoard: (columns, tasks) => set({ columns, tasks, isLoading: false }),

  addTask: (task) =>
    set((state) => {
      const columnTasks = [...(state.tasks[task.columnId] || [])];
      columnTasks.push(task);
      columnTasks.sort((a, b) => a.position - b.position);
      return { tasks: { ...state.tasks, [task.columnId]: columnTasks } };
    }),

  updateTask: (task) =>
    set((state) => {
      const newTasks = { ...state.tasks };
      for (const columnId of Object.keys(newTasks)) {
        newTasks[columnId] = newTasks[columnId].map((t) =>
          t.id === task.id ? { ...t, ...task } : t,
        );
      }
      return { tasks: newTasks };
    }),

  removeTask: (taskId, columnId) =>
    set((state) => {
      const columnTasks = (state.tasks[columnId] || []).filter((t) => t.id !== taskId);
      return { tasks: { ...state.tasks, [columnId]: columnTasks } };
    }),

  moveTask: (taskId, fromColumnId, toColumnId, newPosition) =>
    set((state) => {
      const newTasks = { ...state.tasks };
      // Remove from source column
      const fromTasks = [...(newTasks[fromColumnId] || [])];
      const taskIndex = fromTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return state;

      const [movedTask] = fromTasks.splice(taskIndex, 1);
      newTasks[fromColumnId] = fromTasks;

      // Add to target column
      const toTasks = [...(newTasks[toColumnId] || [])];
      const updatedTask = { ...movedTask, columnId: toColumnId, position: newPosition };
      toTasks.splice(newPosition, 0, updatedTask);
      // Recalculate positions
      toTasks.forEach((t, i) => { t.position = i; });
      newTasks[toColumnId] = toTasks;

      return { tasks: newTasks };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ columns: [], tasks: {}, isLoading: false }),
}));
