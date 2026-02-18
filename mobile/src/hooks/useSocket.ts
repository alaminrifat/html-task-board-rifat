import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '~/lib/constants';
import { tokenStorage } from '~/utils/tokenStorage';
import { useBoardStore } from '~/store/boardStore';
import type { Task } from '~/types/task';

export function useSocket(projectId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const { addTask, updateTask, removeTask, moveTask } = useBoardStore();

  useEffect(() => {
    if (!projectId) return;

    const connect = async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token) return;

      const socket = io(`${WS_URL}/board`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        socket.emit('joinProject', { projectId });
      });

      socket.on('taskCreated', (task: Task) => {
        addTask(task);
      });

      socket.on('taskUpdated', (task: Task) => {
        updateTask(task);
      });

      socket.on('taskMoved', (data: { taskId: string; fromColumnId: string; toColumnId: string; newPosition: number }) => {
        moveTask(data.taskId, data.fromColumnId, data.toColumnId, data.newPosition);
      });

      socket.on('taskDeleted', (data: { taskId: string; columnId: string }) => {
        removeTask(data.taskId, data.columnId);
      });

      socket.on('error', (error: { message: string }) => {
        console.warn('WebSocket error:', error.message);
      });

      socketRef.current = socket;
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, addTask, updateTask, removeTask, moveTask]);

  const emitMoveTask = useCallback(
    (data: { taskId: string; fromColumnId: string; toColumnId: string; newPosition: number }) => {
      socketRef.current?.emit('moveTask', { projectId, ...data });
    },
    [projectId],
  );

  const emitCreateTask = useCallback(
    (data: { columnId: string; title: string }) => {
      socketRef.current?.emit('createTask', { projectId, ...data });
    },
    [projectId],
  );

  const emitUpdateTask = useCallback(
    (data: { taskId: string; updates: Record<string, unknown> }) => {
      socketRef.current?.emit('updateTask', { projectId, ...data });
    },
    [projectId],
  );

  const emitDeleteTask = useCallback(
    (data: { taskId: string }) => {
      socketRef.current?.emit('deleteTask', { projectId, ...data });
    },
    [projectId],
  );

  return {
    socket: socketRef.current,
    emitMoveTask,
    emitCreateTask,
    emitUpdateTask,
    emitDeleteTask,
  };
}
