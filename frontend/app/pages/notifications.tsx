import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import {
  UserPlus,
  Clock,
  AtSign,
  ArrowRight,
  MessageCircle,
  FolderPlus,
  X,
} from 'lucide-react';

import DataState from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import { notificationService } from '~/services/httpServices/notificationService';

import type { Notification } from '~/types/notification';

const NOTIFICATION_ICON_MAP: Record<
  Notification['type'],
  { icon: typeof UserPlus; colorClass: string }
> = {
  TASK_ASSIGNED: { icon: UserPlus, colorClass: 'text-[#4A90D9]' },
  DUE_DATE_REMINDER: { icon: Clock, colorClass: 'text-[#F59E0B]' },
  COMMENT_MENTION: { icon: AtSign, colorClass: 'text-[#8B5CF6]' },
  STATUS_CHANGE: { icon: ArrowRight, colorClass: 'text-[#10B981]' },
  NEW_COMMENT: { icon: MessageCircle, colorClass: 'text-[#3B82F6]' },
  INVITATION: { icon: UserPlus, colorClass: 'text-[#4A90D9]' },
  PROJECT_CREATED: { icon: FolderPlus, colorClass: 'text-[#10B981]' },
};

/**
 * Formats notification message with bold text for quoted names/titles
 * and the actor name at the beginning (before common verbs).
 * Matches the reference design: bold names + bold quoted items.
 */
function formatNotificationMessage(message: string): React.ReactNode {
  // Step 1: Identify actor name (text before common verbs)
  const verbPattern =
    /^(.+?)\s+(invited|assigned|mentioned|commented|moved|added|removed|updated|created|changed|completed)\b/;
  const verbMatch = verbPattern.exec(message);
  const actorName = verbMatch?.[1];
  const afterActor = actorName ? message.slice(actorName.length) : message;

  // Step 2: Split remaining text by quoted segments (both "..." and '...')
  const quoteRegex = /["'\u201C\u201D\u2018\u2019]([^"'\u201C\u201D\u2018\u2019]+)["'\u201C\u201D\u2018\u2019]/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  const textToParse = afterActor;

  // Add the actor name as bold if found
  if (actorName) {
    parts.push(
      <span key="actor" className="font-semibold">
        {actorName}
      </span>,
    );
  }

  while ((match = quoteRegex.exec(textToParse)) !== null) {
    // Text before the quoted segment
    if (match.index > lastIdx) {
      parts.push(textToParse.slice(lastIdx, match.index));
    }
    // Bold quoted segment (keep quotes for display, matching reference style)
    parts.push(
      <span key={`q-${match.index}`} className="font-semibold">
        &lsquo;{match[1]}&rsquo;
      </span>,
    );
    lastIdx = match.index + match[0].length;
  }

  // Remaining text after last quote
  if (lastIdx < textToParse.length) {
    parts.push(textToParse.slice(lastIdx));
  }

  return parts.length > 0 ? <>{parts}</> : message;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type FilterTab = 'all' | 'assignments' | 'comments' | 'deadlines';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'comments', label: 'Comments' },
  { key: 'deadlines', label: 'Deadlines' },
];

const FILTER_TYPE_MAP: Record<FilterTab, Notification['type'][]> = {
  all: [],
  assignments: ['TASK_ASSIGNED', 'INVITATION'],
  comments: ['NEW_COMMENT', 'COMMENT_MENTION'],
  deadlines: ['DUE_DATE_REMINDER'],
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchNotifications = useCallback(() => {
    setIsLoading(true);
    setError(null);
    notificationService
      .list({ limit: 50 })
      .then((response) => setNotifications(response?.data ?? []))
      .catch((err: unknown) => {
        const message =
          err != null && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to load notifications';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.delete(notificationId);
      setNotifications((prev) =>
        (prev ?? []).filter((n) => n.id !== notificationId)
      );
    } catch {
      // Silently fail
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        (prev ?? []).map((n) => ({ ...n, isRead: true }))
      );
    } catch {
      // Silently fail - user can retry
    }
  }, []);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.isRead) {
        notificationService.markRead(notification.id).catch(() => {
          // Silently fail
        });
        setNotifications((prev) =>
          (prev ?? []).map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // Navigate based on notification type
      if (notification.taskId && notification.projectId) {
        navigate(`/projects/${notification.projectId}/tasks/${notification.taskId}`);
      } else if (notification.type === 'INVITATION' && notification.projectId) {
        navigate(`/invitations/accept?projectId=${notification.projectId}`);
      } else if (notification.type === 'PROJECT_CREATED' && notification.projectId) {
        navigate(`/projects/${notification.projectId}/board`);
      }
    },
    [navigate]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="bg-white h-[56px] flex items-center justify-between px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">
          Notifications
        </h2>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-sm font-medium text-[#4A90D9] hover:text-[#3B82F6] transition-colors whitespace-nowrap"
        >
          Mark all as read
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white px-4 pt-2 pb-0 border-b border-[#E5E7EB] flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
              activeFilter === tab.key
                ? 'text-[#4A90D9] border-[#4A90D9]'
                : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[70px]">
        <DataState<Notification[]>
          isLoading={isLoading}
          error={error}
          data={notifications}
          onRetry={fetchNotifications}
        >
          {(notificationList) => {
            const filterTypes = FILTER_TYPE_MAP[activeFilter];
            const filteredList = filterTypes.length > 0
              ? (notificationList ?? []).filter((n) => filterTypes.includes(n.type))
              : notificationList ?? [];
            return (
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm">
              {filteredList.map((notification, index) => {
                const iconConfig = NOTIFICATION_ICON_MAP[notification.type];
                const IconComponent = iconConfig?.icon ?? UserPlus;
                const iconColor = iconConfig?.colorClass ?? 'text-[#4A90D9]';
                const isLast = index === filteredList.length - 1;

                return (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    className={cn(
                      'flex items-start gap-3 p-4 min-h-[64px] relative group transition-colors cursor-pointer',
                      !isLast && 'border-b border-[#E5E7EB]',
                      notification.isRead
                        ? 'bg-white hover:bg-[#F9FAFB]'
                        : 'bg-[#F0F7FF] hover:bg-[#EBF5FF]'
                    )}
                  >
                    {/* Unread Dot */}
                    {!notification.isRead ? (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4A90D9]" />
                    ) : null}

                    {/* Type Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 mt-0.5',
                        iconColor,
                        notification.isRead ? 'ml-4' : 'ml-2'
                      )}
                    >
                      <IconComponent size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-grow text-base leading-snug text-[#1E293B]">
                      {formatNotificationMessage(notification.message)}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-xs text-[#64748B] pt-1 whitespace-nowrap">
                      {formatRelativeTime(notification.createdAt)}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all ml-1"
                      aria-label="Dismiss notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
          }}
        </DataState>
      </main>
    </div>
  );
}
