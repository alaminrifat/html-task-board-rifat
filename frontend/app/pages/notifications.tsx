import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import {
  UserPlus,
  Clock,
  AtSign,
  ArrowRight,
  MessageCircle,
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
};

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

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Navigate to task if available
      if (notification.taskId && notification.projectId) {
        navigate(`/projects/${notification.projectId}/tasks/${notification.taskId}`);
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

      {/* Notification List */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[70px]">
        <DataState<Notification[]>
          isLoading={isLoading}
          error={error}
          data={notifications}
          onRetry={fetchNotifications}
        >
          {(notificationList) => (
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm">
              {(notificationList ?? []).map((notification, index) => {
                const iconConfig = NOTIFICATION_ICON_MAP[notification.type];
                const IconComponent = iconConfig?.icon ?? UserPlus;
                const iconColor = iconConfig?.colorClass ?? 'text-[#4A90D9]';
                const isLast = index === notificationList.length - 1;

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
                      {notification.message}
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
          )}
        </DataState>
      </main>
    </div>
  );
}
