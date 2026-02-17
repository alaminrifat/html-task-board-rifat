import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  Paperclip,
  PlusCircle,
  PlayCircle,
  Send,
  Trash2,
} from 'lucide-react';

import { cn } from '~/lib/utils';
import DataState from '~/components/ui/empty-state';
import { taskService } from '~/services/httpServices/taskService';
import { subTaskService } from '~/services/httpServices/subTaskService';
import { commentService } from '~/services/httpServices/commentService';
import { timeEntryService } from '~/services/httpServices/timeEntryService';
import { columnService } from '~/services/httpServices/columnService';
import { attachmentService } from '~/services/httpServices/attachmentService';
import { memberService } from '~/services/httpServices/memberService';

import type { Task, SubTask } from '~/types/task';
import type { Comment } from '~/types/comment';
import type { TimeEntry } from '~/types/time-entry';
import type { Column } from '~/types/column';
import type { Attachment } from '~/types/attachment';
import type { ProjectMember } from '~/types/member';

// --- Helpers ---

const PRIORITY_COLORS: Record<Task['priority'], { dot: string; label: string }> = {
  URGENT: { dot: 'bg-[#EF4444]', label: 'Urgent' },
  HIGH: { dot: 'bg-orange-500', label: 'High' },
  MEDIUM: { dot: 'bg-[#4A90D9]', label: 'Medium' },
  LOW: { dot: 'bg-gray-400', label: 'Low' },
};

const PRIORITY_OPTIONS: Task['priority'][] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

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

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatShortDate(dateStr);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Convert a date string (ISO or similar) to YYYY-MM-DD for the date input */
function toDateInputValue(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Types for page data ---

interface TaskDetailData {
  task: Task;
  columns: Column[];
  members: ProjectMember[];
  subTasks: SubTask[];
  comments: Comment[];
  timeEntries: TimeEntry[];
  attachments: Attachment[];
}

// --- Component ---

export default function TaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState<TaskDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local interaction state
  const [newSubTask, setNewSubTask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingSubTask, setIsSubmittingSubTask] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId || !taskId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [taskData, columnsData, membersData, subTasksData, commentsData, entriesData, attachmentsData] = await Promise.all([
        taskService.getById(projectId, taskId),
        columnService.list(projectId),
        memberService.list(projectId),
        subTaskService.list(projectId, taskId),
        commentService.list(projectId, taskId),
        timeEntryService.list(projectId, taskId),
        attachmentService.list(projectId, taskId),
      ]);

      setPageData({
        task: taskData,
        columns: columnsData ?? [],
        members: membersData ?? [],
        subTasks: subTasksData ?? [],
        comments: commentsData ?? [],
        timeEntries: entriesData ?? [],
        attachments: attachmentsData ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load task';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  const handleStatusChange = useCallback(async (newColumnId: string) => {
    if (!projectId || !taskId) return;
    try {
      await taskService.move(projectId, taskId, { columnId: newColumnId, position: 0 });
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, task: { ...prev.task, columnId: newColumnId } };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handlePriorityChange = useCallback(async (newPriority: Task['priority']) => {
    if (!projectId || !taskId) return;
    try {
      await taskService.update(projectId, taskId, { priority: newPriority });
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, task: { ...prev.task, priority: newPriority } };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleDueDateChange = useCallback(async (newDate: string) => {
    if (!projectId || !taskId) return;
    try {
      await taskService.update(projectId, taskId, { dueDate: newDate || undefined });
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, task: { ...prev.task, dueDate: newDate || undefined } };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleAssigneeChange = useCallback(async (newAssigneeId: string) => {
    if (!projectId || !taskId) return;
    const assigneeId = newAssigneeId || undefined;
    try {
      await taskService.update(projectId, taskId, { assigneeId: assigneeId ?? null });
      const member = pageData?.members.find((m) => m.userId === newAssigneeId);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          task: {
            ...prev.task,
            assigneeId: assigneeId,
            assignee: member?.user ? { id: member.userId, fullName: member.user.fullName, profilePhotoUrl: member.user.profilePhotoUrl } : undefined,
          },
        };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId, pageData?.members]);

  const handleToggleSubTask = useCallback(
    async (subTask: SubTask) => {
      if (!projectId || !taskId) return;

      try {
        const updated = await subTaskService.update(projectId, taskId, subTask.id, {
          isCompleted: !subTask.isCompleted,
        });
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            subTasks: (prev.subTasks ?? []).map((st) =>
              st.id === subTask.id ? (updated ?? { ...st, isCompleted: !st.isCompleted }) : st
            ),
          };
        });
      } catch {
        // Silently fail - could add toast notification here
      }
    },
    [projectId, taskId]
  );

  const handleAddSubTask = useCallback(async () => {
    if (!projectId || !taskId || !newSubTask.trim()) return;

    try {
      setIsSubmittingSubTask(true);
      const created = await subTaskService.create(projectId, taskId, {
        title: newSubTask.trim(),
      });
      if (created) {
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            subTasks: [...(prev.subTasks ?? []), created],
          };
        });
      }
      setNewSubTask('');
    } catch {
      // Silently fail
    } finally {
      setIsSubmittingSubTask(false);
    }
  }, [projectId, taskId, newSubTask]);

  const handleDeleteSubTask = useCallback(async (subTaskId: string) => {
    if (!projectId || !taskId) return;
    try {
      await subTaskService.delete(projectId, taskId, subTaskId);
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, subTasks: prev.subTasks.filter((st) => st.id !== subTaskId) };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleAddComment = useCallback(async () => {
    if (!projectId || !taskId || !newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const created = await commentService.create(projectId, taskId, {
        content: newComment.trim(),
      });
      if (created) {
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...(prev.comments ?? []), created],
          };
        });
      }
      setNewComment('');
    } catch {
      // Silently fail
    } finally {
      setIsSubmittingComment(false);
    }
  }, [projectId, taskId, newComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!projectId || !taskId) return;
    try {
      await commentService.delete(projectId, taskId, commentId);
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleStartTimer = useCallback(async () => {
    if (!projectId || !taskId) return;

    try {
      await timeEntryService.start(projectId, taskId);
      // Refetch time entries to get updated list
      const entriesData = await timeEntryService.list(projectId, taskId);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timeEntries: entriesData ?? [],
        };
      });
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const handleStopTimer = useCallback(async (timeEntryId: string) => {
    if (!projectId || !taskId) return;
    try {
      await timeEntryService.stop(timeEntryId);
      // Refetch to get updated entries
      const entriesData = await timeEntryService.list(projectId, taskId);
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, timeEntries: entriesData ?? [] };
      });
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleUploadAttachment = useCallback(async (file: File) => {
    if (!projectId || !taskId) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const newAttachment = await attachmentService.upload(projectId, taskId, formData);
      if (newAttachment) {
        setPageData((prev) => {
          if (!prev) return prev;
          return { ...prev, attachments: [...prev.attachments, newAttachment] };
        });
      }
    } catch { /* silently fail */ }
  }, [projectId, taskId]);

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    if (!projectId) return;
    try {
      await attachmentService.delete(projectId, attachmentId);
      setPageData((prev) => {
        if (!prev) return prev;
        return { ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) };
      });
    } catch { /* silently fail */ }
  }, [projectId]);

  const handleDelete = useCallback(async () => {
    if (!projectId || !taskId) return;

    try {
      setIsDeleting(true);
      await taskService.delete(projectId, taskId);
      navigate(`/projects/${projectId}/board`);
    } catch {
      setIsDeleting(false);
    }
  }, [projectId, taskId, navigate]);

  // --- Derived values ---

  const task = pageData?.task;
  const columns = pageData?.columns ?? [];
  const members = pageData?.members ?? [];
  const subTasks = pageData?.subTasks ?? [];
  const comments = pageData?.comments ?? [];
  const timeEntries = pageData?.timeEntries ?? [];

  const completedSubTasks = subTasks.filter((st) => st.isCompleted).length;
  const totalSubTasks = subTasks.length;
  const subTaskProgress = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0;

  const totalMinutes = timeEntries.reduce((sum, te) => sum + (te.durationMinutes ?? 0), 0);

  const priorityInfo = task ? (PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.LOW) : PRIORITY_COLORS.LOW;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center gap-2 px-3 shrink-0 z-30">
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/board`)}
          className="flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0"
          aria-label="Back to board"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h4 className="text-lg font-semibold tracking-tight text-[#1E293B] truncate">
          {task?.title ?? 'Loading...'}
        </h4>
      </header>

      {/* Scrollable Content */}
      <DataState<TaskDetailData>
        isLoading={isLoading}
        error={error}
        data={pageData}
        onRetry={fetchData}
      >
        {(data) => {
          const currentTask = data.task;

          return (
            <main className="flex-1 overflow-y-auto hide-scrollbar p-3 pb-6 flex flex-col gap-3">
              {/* Status & Priority Selectors */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status Selector */}
                <select
                  value={currentTask.columnId ?? ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="h-7 px-2 text-xs rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>

                {/* Priority Selector */}
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', priorityInfo.dot)} />
                  <select
                    value={currentTask.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Task['priority'])}
                    className="h-7 px-2 text-xs rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PRIORITY_COLORS[p].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metadata Card */}
              <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
                {/* Description */}
                {currentTask.description ? (
                  <p className="text-sm leading-relaxed text-[#1E293B]">
                    {currentTask.description}
                  </p>
                ) : null}

                {/* Properties Grid */}
                <div className="grid grid-cols-[80px_1fr] gap-y-3 items-center">
                  {/* Assignee */}
                  <div className="text-xs font-medium text-[#64748B]">Assignee</div>
                  <select
                    value={currentTask.assigneeId ?? ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="h-7 px-2 text-xs rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user?.fullName ?? member.userId}
                      </option>
                    ))}
                  </select>

                  {/* Due date - Editable */}
                  <div className="text-xs font-medium text-[#64748B]">Due date</div>
                  <div className="flex items-center gap-1.5 text-[#1E293B]">
                    <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
                    <input
                      type="date"
                      value={currentTask.dueDate ? toDateInputValue(currentTask.dueDate) : ''}
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className="h-7 px-2 text-xs rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9]"
                    />
                  </div>

                  {/* Labels */}
                  {(currentTask.labels ?? []).length > 0 ? (
                    <>
                      <div className="text-xs font-medium text-[#64748B]">Labels</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(currentTask.labels ?? []).map((label) => (
                          <span
                            key={label.id}
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: `${label.color}1A`,
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </section>

              {/* Sub-tasks Card */}
              <SubTasksSection
                subTasks={subTasks}
                completedCount={completedSubTasks}
                totalCount={totalSubTasks}
                progress={subTaskProgress}
                newSubTask={newSubTask}
                isSubmitting={isSubmittingSubTask}
                onNewSubTaskChange={setNewSubTask}
                onAddSubTask={handleAddSubTask}
                onToggleSubTask={handleToggleSubTask}
                onDeleteSubTask={handleDeleteSubTask}
              />

              {/* Time Tracking Card */}
              <TimeTrackingSection
                timeEntries={timeEntries}
                totalMinutes={totalMinutes}
                onStartTimer={handleStartTimer}
                onStopTimer={handleStopTimer}
              />

              {/* Attachments */}
              <AttachmentsSection
                attachments={pageData?.attachments ?? []}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
              />

              {/* Comments Card */}
              <CommentsSection
                comments={comments}
                newComment={newComment}
                isSubmitting={isSubmittingComment}
                onNewCommentChange={setNewComment}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
              />

              {/* Move to Trash */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full h-12 shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] text-[#EF4444] font-medium hover:bg-red-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Move to Trash'}
              </button>
            </main>
          );
        }}
      </DataState>
    </div>
  );
}

// --- Sub-components ---

interface SubTasksSectionProps {
  subTasks: SubTask[];
  completedCount: number;
  totalCount: number;
  progress: number;
  newSubTask: string;
  isSubmitting: boolean;
  onNewSubTaskChange: (value: string) => void;
  onAddSubTask: () => void;
  onToggleSubTask: (subTask: SubTask) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}

function SubTasksSection({
  subTasks,
  completedCount,
  totalCount,
  progress,
  newSubTask,
  isSubmitting,
  onNewSubTaskChange,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
}: SubTasksSectionProps) {
  return (
    <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Sub-tasks</h4>
        <span className="text-xs font-medium text-[#64748B]">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 ? (
        <div className="h-1 w-full bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {(subTasks ?? []).map((subTask) => (
          <label
            key={subTask.id}
            className="flex items-start gap-2.5 cursor-pointer group"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleSubTask(subTask);
              }}
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                subTask.isCompleted
                  ? 'bg-[#4A90D9] border-[#4A90D9]'
                  : 'bg-white border-[#CBD5E1] group-hover:border-[#4A90D9]'
              )}
              aria-label={`Toggle ${subTask.title}`}
            >
              {subTask.isCompleted ? (
                <Check className="h-3 w-3 text-white" />
              ) : null}
            </button>
            <span
              className={cn(
                'text-sm select-none flex-1',
                subTask.isCompleted
                  ? 'text-[#94A3B8] line-through'
                  : 'text-[#1E293B]'
              )}
            >
              {subTask.title}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onDeleteSubTask(subTask.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all ml-auto shrink-0"
              aria-label={`Delete ${subTask.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </label>
        ))}
      </div>

      {/* Add new */}
      <div className="mt-3 flex items-center gap-2.5 pl-0.5">
        <PlusCircle className="h-4 w-4 text-[#94A3B8] shrink-0" />
        <input
          type="text"
          value={newSubTask}
          onChange={(e) => onNewSubTaskChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddSubTask();
            }
          }}
          placeholder="Add a sub-task..."
          disabled={isSubmitting}
          className="w-full bg-transparent border-none text-sm placeholder-[#94A3B8] focus:ring-0 focus:outline-none p-0 text-[#1E293B] disabled:opacity-50"
        />
      </div>
    </section>
  );
}

interface TimeTrackingSectionProps {
  timeEntries: TimeEntry[];
  totalMinutes: number;
  onStartTimer: () => void;
  onStopTimer: (timeEntryId: string) => void;
}

function TimeTrackingSection({
  timeEntries,
  totalMinutes,
  onStartTimer,
  onStopTimer,
}: TimeTrackingSectionProps) {
  return (
    <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Time Tracking</h4>
        <button
          type="button"
          onClick={onStartTimer}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E7EB] text-[#4A90D9] hover:bg-[#F0F7FF] transition-colors"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Start Timer</span>
        </button>
      </div>

      {(timeEntries ?? []).length > 0 ? (
        <>
          <div className="flex flex-col gap-2.5">
            {(timeEntries ?? []).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-0.5 h-7 rounded-full bg-[#E5E7EB]" />
                  <div className="flex flex-col">
                    <span className="text-[#1E293B] font-medium">
                      {entry.description ?? 'Timer entry'}
                    </span>
                    <span className="text-[#64748B] text-[10px]">
                      {entry.createdAt ? formatShortDate(entry.createdAt) : ''}{' '}
                      {entry.userId ? `\u00B7 ${entry.userId}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!entry.endedAt && (
                    <button
                      type="button"
                      onClick={() => onStopTimer(entry.id)}
                      className="text-[10px] font-medium text-[#EF4444] hover:text-[#DC2626] transition-colors"
                    >
                      Stop
                    </button>
                  )}
                  <span className="font-medium text-[#1E293B]">
                    {formatDuration(entry.durationMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-dashed border-[#E5E7EB] flex justify-end">
            <span className="text-xs text-[#1E293B]">
              Total: <span className="font-semibold">{formatDuration(totalMinutes)}</span>
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-[#94A3B8]">No time entries yet.</p>
      )}
    </section>
  );
}

interface AttachmentsSectionProps {
  attachments: Attachment[];
  onUpload: (file: File) => void;
  onDelete: (attachmentId: string) => void;
}

function AttachmentsSection({ attachments, onUpload, onDelete }: AttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Attachments</h4>
          <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {(attachments ?? []).length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E7EB] text-[#4A90D9] hover:bg-[#F0F7FF] transition-colors"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Attach</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      {(attachments ?? []).length > 0 ? (
        <div className="flex flex-col gap-2">
          {(attachments ?? []).map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between text-xs group">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span className="text-[#1E293B] font-medium truncate">
                  {attachment.fileName ?? 'File'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(attachment.id)}
                className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all shrink-0 ml-2"
                aria-label="Delete attachment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#94A3B8]">No attachments yet.</p>
      )}
    </section>
  );
}

interface CommentsSectionProps {
  comments: Comment[];
  newComment: string;
  isSubmitting: boolean;
  onNewCommentChange: (value: string) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
}

function CommentsSection({
  comments,
  newComment,
  isSubmitting,
  onNewCommentChange,
  onAddComment,
  onDeleteComment,
}: CommentsSectionProps) {
  return (
    <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Comments</h4>
        <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          {(comments ?? []).length}
        </span>
      </div>

      {/* Comment list */}
      {(comments ?? []).length > 0 ? (
        <div className="flex flex-col gap-3 mb-3">
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="flex gap-2.5 group">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0',
                  getAvatarColor(comment.userId ?? '')
                )}
              >
                {getInitial(comment.userId ?? '')}
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#1E293B]">
                    {comment.userId ?? 'Unknown'}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{comment.content}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteComment(comment.id)}
                className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all shrink-0"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#94A3B8] mb-3">No comments yet.</p>
      )}

      {/* Comment Input */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#4A90D9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
          Y
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddComment();
              }
            }}
            placeholder="Write a comment..."
            disabled={isSubmitting}
            className="w-full h-[34px] pl-2.5 pr-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:border-[#4A90D9] focus:bg-white transition-colors placeholder-[#94A3B8] text-[#1E293B] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onAddComment}
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#4A90D9] hover:text-[#3B82F6] p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send comment"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
