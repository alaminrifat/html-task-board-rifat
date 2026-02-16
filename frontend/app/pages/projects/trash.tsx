import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Info, Clock, User, RotateCcw, CheckCircle } from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import DataState from '~/components/ui/empty-state';
import { taskService } from '~/services/httpServices/taskService';
import { cn } from '~/lib/utils';

import type { Task } from '~/types/task';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(deletedAt?: string): number {
  if (!deletedAt) return 30;
  const deleted = new Date(deletedAt);
  const expiresAt = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Trash() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [trashedTasks, setTrashedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchTrashedTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const tasks = await taskService.listTrash(projectId);
      setTrashedTasks(tasks ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load trash';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTrashedTasks();
  }, [fetchTrashedTasks]);

  const handleRestore = useCallback(
    async (taskId: string) => {
      if (!projectId || actionInProgress) return;

      try {
        setActionInProgress(taskId);
        await taskService.restore(projectId, taskId);
        setTrashedTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch {
        // Restore failed
      } finally {
        setActionInProgress(null);
      }
    },
    [projectId, actionInProgress]
  );

  const handlePermanentDelete = useCallback(
    async (taskId: string) => {
      if (!projectId || actionInProgress) return;

      try {
        setActionInProgress(taskId);
        await taskService.permanentDelete(projectId, taskId);
        setTrashedTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch {
        // Delete failed
      } finally {
        setActionInProgress(null);
      }
    },
    [projectId, actionInProgress]
  );

  return (
    <div className="flex flex-col h-full">
      <MobileHeader
        title="Trash"
        onBack={() => navigate(`/projects/${projectId}/board`)}
      />

      <DataState<Task[]>
        isLoading={isLoading}
        error={error}
        data={trashedTasks}
        onRetry={fetchTrashedTasks}
        emptyComponent={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-3 text-[#10B981]">
              <CheckCircle className="h-9 w-9" />
            </div>
            <h4 className="text-sm font-medium text-[#1E293B] mb-1">No deleted tasks</h4>
            <p className="text-xs text-[#64748B]">Trash is empty</p>
          </div>
        }
      >
        {(tasks) => (
          <main className="flex-1 overflow-y-auto hide-scrollbar p-3">
            {/* Info Banner */}
            <div className="bg-[#FEF3C7] rounded-lg p-3 mb-3 flex items-start gap-3 border border-[#FCD34D]/20">
              <Info className="text-[#F59E0B] shrink-0 mt-0.5 h-5 w-5" />
              <p className="text-sm text-[#92400E] leading-relaxed">
                Tasks are permanently deleted after 30 days.
              </p>
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-2.5">
              {(tasks ?? []).map((task) => {
                const daysRemaining = getDaysRemaining(task.deletedAt);
                const isUrgent = daysRemaining < 7;
                const isProcessing = actionInProgress === task.id;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'bg-white border border-[#E5E7EB] rounded-lg p-3 transition-shadow hover:shadow-sm group',
                      isProcessing && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-sm font-medium text-[#1E293B] line-through decoration-[#94A3B8] decoration-1 opacity-75 leading-snug">
                          {task.title}
                        </h4>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#64748B]">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Deleted by {task.deletedById ?? 'Unknown'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        <span>{formatDate(task.deletedAt)}</span>
                        <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        {isUrgent ? (
                          <span className="text-[#F59E0B] font-medium flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {daysRemaining} days remaining
                          </span>
                        ) : (
                          <span>{daysRemaining} days remaining</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-[#F1F5F9]">
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(task.id)}
                          disabled={isProcessing}
                          className="h-[32px] px-3 rounded-md text-[#EF4444] text-xs font-medium hover:bg-[#FEF2F2] transition-colors"
                        >
                          Delete Permanently
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestore(task.id)}
                          disabled={isProcessing}
                          className="h-[32px] px-3 rounded-md border border-[#4A90D9] text-[#4A90D9] text-xs font-medium hover:bg-[#F0F9FF] transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>
                      </div>
                    </div>
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
