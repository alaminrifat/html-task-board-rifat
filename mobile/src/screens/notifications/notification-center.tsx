import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';
import {
  Bell,
  UserPlus,
  Clock,
  GitBranch,
  AtSign,
  MessageSquare,
  Mail,
  FolderPlus,
  Trash2,
  CheckCheck,
} from 'lucide-react-native';

import type { AppTabParamList } from '~/navigation/app-tabs';
import type { ProjectStackParamList } from '~/navigation/project-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Header } from '~/components/layout/header';
import { EmptyState } from '~/components/ui/empty-state';
import { notificationService } from '~/services/notificationService';
import type { Notification, PaginationMeta } from '~/types';
import { COLORS } from '~/lib/constants';

type NotificationsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'InboxTab'>,
  NativeStackNavigationProp<ProjectStackParamList>
>;

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: Notification['type']): React.ReactNode {
  const iconSize = 18;
  switch (type) {
    case 'TASK_ASSIGNED':
      return <UserPlus size={iconSize} color={COLORS.primary} />;
    case 'DUE_DATE_REMINDER':
      return <Clock size={iconSize} color={COLORS.warning} />;
    case 'STATUS_CHANGE':
      return <GitBranch size={iconSize} color={COLORS.info} />;
    case 'COMMENT_MENTION':
      return <AtSign size={iconSize} color={COLORS.danger} />;
    case 'NEW_COMMENT':
      return <MessageSquare size={iconSize} color={COLORS.success} />;
    case 'INVITATION':
      return <Mail size={iconSize} color={COLORS.primaryDark} />;
    case 'PROJECT_CREATED':
      return <FolderPlus size={iconSize} color={COLORS.success} />;
    default:
      return <Bell size={iconSize} color={COLORS.muted} />;
  }
}

function getNotificationIconBg(type: Notification['type']): string {
  switch (type) {
    case 'TASK_ASSIGNED':
      return COLORS.primaryLight;
    case 'DUE_DATE_REMINDER':
      return '#FEF3C7';
    case 'STATUS_CHANGE':
      return '#DBEAFE';
    case 'COMMENT_MENTION':
      return '#FEE2E2';
    case 'NEW_COMMENT':
      return '#D1FAE5';
    case 'INVITATION':
      return COLORS.primaryLight;
    case 'PROJECT_CREATED':
      return '#D1FAE5';
    default:
      return '#F3F4F6';
  }
}

export function NotificationsScreen() {
  const navigation = useNavigation<NotificationsNavProp>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      const result = await notificationService.list({
        page: pageNum,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      if (append) {
        setNotifications((prev) => [...prev, ...result.data]);
      } else {
        setNotifications(result.data);
      }
      setMeta(result.meta);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications(1).finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchNotifications(1);
    setIsRefreshing(false);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !meta?.hasNextPage) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage, true);
    setIsLoadingMore(false);
  }, [isLoadingMore, meta, page, fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAllRead(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      Alert.alert('Error', 'Failed to mark all as read.');
    } finally {
      setIsMarkingAllRead(false);
    }
  }, []);

  const handleMarkRead = useCallback(async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        );
      } catch {
        // Silently fail
      }
    }
  }, []);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      await handleMarkRead(notification);

      // Navigate based on notification type / data
      if (notification.taskId && notification.projectId) {
        navigation.navigate('ProjectsTab', {
          screen: 'TaskDetail',
          params: { projectId: notification.projectId, taskId: notification.taskId },
        } as any);
      } else if (notification.projectId) {
        navigation.navigate('ProjectsTab', {
          screen: 'Board',
          params: { projectId: notification.projectId, projectTitle: 'Project' },
        } as any);
      }
    },
    [navigation, handleMarkRead],
  );

  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.delete(notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch {
        Alert.alert('Error', 'Failed to delete notification.');
      }
    },
    [],
  );

  const renderRightActions = useCallback(
    (notificationId: string) => {
      return (
        <TouchableOpacity
          className="bg-danger items-center justify-center px-6"
          onPress={() => handleDelete(notificationId)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#FFF" />
          <Text className="text-xs text-white mt-1">Delete</Text>
        </TouchableOpacity>
      );
    },
    [handleDelete],
  );

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => {
      return (
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          overshootRight={false}
        >
          <TouchableOpacity
            className={`flex-row items-start px-4 py-3 border-b border-border ${
              item.isRead ? 'bg-white' : 'bg-primary/5'
            }`}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: getNotificationIconBg(item.type) }}
            >
              {getNotificationIcon(item.type)}
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-0.5">
                <Text
                  className={`text-sm flex-1 mr-2 ${
                    item.isRead ? 'text-secondary-800' : 'text-secondary-800 font-semibold'
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-xs text-muted">{formatTimeAgo(item.createdAt)}</Text>
              </View>
              <Text className="text-xs text-muted" numberOfLines={2}>
                {item.message}
              </Text>
            </View>

            {/* Unread indicator */}
            {!item.isRead && (
              <View
                className="w-2.5 h-2.5 rounded-full ml-2 mt-1.5"
                style={{ backgroundColor: COLORS.primary }}
              />
            )}
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [handleNotificationPress, renderRightActions],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <ScreenWrapper>
      <Header
        title="Notifications"
        rightAction={
          hasUnread ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="flex-row items-center"
              activeOpacity={0.7}
            >
              {isMarkingAllRead ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <CheckCheck size={16} color={COLORS.primary} />
                  <Text
                    className="text-xs font-medium ml-1"
                    style={{ color: COLORS.primary }}
                  >
                    Mark all read
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} color={COLORS.muted} />}
          title="No notifications"
          description="You're all caught up! Notifications about your tasks and projects will appear here."
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}
