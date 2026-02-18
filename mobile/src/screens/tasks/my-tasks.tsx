import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ListChecks,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Folder,
} from 'lucide-react-native';

import type { AppTabParamList } from '~/navigation/app-tabs';
import type { ProjectStackParamList } from '~/navigation/project-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Header } from '~/components/layout/header';
import { Card } from '~/components/ui/card';
import { PriorityBadge } from '~/components/ui/badge';
import { Avatar } from '~/components/ui/avatar';
import { EmptyState } from '~/components/ui/empty-state';
import { taskService } from '~/services/taskService';
import type { Task, PaginationMeta } from '~/types';
import { COLORS, PRIORITY_COLORS } from '~/lib/constants';

// Navigation type that allows navigating to TaskDetail inside ProjectStack
type MyTasksNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'MyTasksTab'>,
  NativeStackNavigationProp<ProjectStackParamList>
>;

type FilterChip = 'all' | 'overdue' | 'today' | 'this_week';
type SortOption = 'dueDate' | 'priority' | 'project';

const FILTER_OPTIONS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'dueDate', label: 'Due Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'project', label: 'Project' },
];

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = new Date().toDateString();
  return new Date(dueDate).toDateString() === today;
}

function isThisWeek(dueDate?: string): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const d = new Date(dueDate);
  return d >= startOfWeek && d < endOfWeek;
}

function formatDueDate(dueDate?: string): string {
  if (!dueDate) return 'No due date';
  const d = new Date(dueDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function MyTasksScreen() {
  const navigation = useNavigation<MyTasksNavProp>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const sortMap: Record<SortOption, string> = {
          dueDate: 'dueDate',
          priority: 'priority',
          project: 'projectId',
        };

        const result = await taskService.myTasks({
          page: pageNum,
          limit: 20,
          sortBy: sortMap[sortBy],
          sortOrder: sortBy === 'dueDate' ? 'ASC' : 'DESC',
        });

        if (append) {
          setTasks((prev) => [...prev, ...result.data]);
        } else {
          setTasks(result.data);
        }
        setMeta(result.meta);
      } catch {
        // Error handled silently
      }
    },
    [sortBy],
  );

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchTasks(1).finally(() => setIsLoading(false));
  }, [fetchTasks]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchTasks(1);
    setIsRefreshing(false);
  }, [fetchTasks]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !meta?.hasNextPage) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTasks(nextPage, true);
    setIsLoadingMore(false);
  }, [isLoadingMore, meta, page, fetchTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    switch (activeFilter) {
      case 'overdue':
        result = tasks.filter((t) => isOverdue(t.dueDate));
        break;
      case 'today':
        result = tasks.filter((t) => isToday(t.dueDate));
        break;
      case 'this_week':
        result = tasks.filter((t) => isThisWeek(t.dueDate));
        break;
    }

    // Client-side sort for priority grouping
    if (sortBy === 'priority') {
      result = [...result].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4),
      );
    }

    return result;
  }, [tasks, activeFilter, sortBy]);

  const emptyMessages: Record<FilterChip, { title: string; description: string }> = {
    all: {
      title: 'No tasks assigned',
      description: 'Tasks assigned to you will appear here.',
    },
    overdue: {
      title: 'No overdue tasks',
      description: 'You have no overdue tasks. Great job!',
    },
    today: {
      title: 'Nothing due today',
      description: 'You have no tasks due today.',
    },
    this_week: {
      title: 'Nothing due this week',
      description: 'You have no tasks due this week.',
    },
  };

  const handleTaskPress = useCallback(
    (task: Task) => {
      navigation.navigate('ProjectsTab', {
        screen: 'TaskDetail',
        params: { projectId: task.projectId, taskId: task.id },
      } as any);
    },
    [navigation],
  );

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => {
      const overdue = isOverdue(item.dueDate);

      return (
        <TouchableOpacity
          onPress={() => handleTaskPress(item)}
          activeOpacity={0.7}
          className="mx-4 mb-3"
        >
          <Card variant="outlined">
            <View className="flex-row items-start justify-between mb-2">
              <Text
                className="flex-1 text-base font-semibold text-secondary-800 mr-2"
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <PriorityBadge priority={item.priority} />
            </View>

            {item.project && (
              <View className="flex-row items-center mb-2">
                <Folder size={14} color={COLORS.muted} />
                <Text className="text-xs text-muted ml-1" numberOfLines={1}>
                  {item.project.title}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-row items-center">
                <Calendar size={14} color={overdue ? COLORS.danger : COLORS.muted} />
                <Text
                  className={`text-xs ml-1 ${overdue ? 'text-danger font-medium' : 'text-muted'}`}
                >
                  {formatDueDate(item.dueDate)}
                </Text>
              </View>

              {item.assignee && (
                <Avatar
                  name={item.assignee.fullName}
                  imageUrl={item.assignee.avatarUrl}
                  size="sm"
                />
              )}
            </View>

            {item.labels && item.labels.length > 0 && (
              <View className="flex-row flex-wrap mt-2 gap-1">
                {item.labels.slice(0, 3).map((label) => (
                  <View
                    key={label.id}
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: label.color + '20' }}
                  >
                    <Text className="text-xs" style={{ color: label.color }}>
                      {label.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      );
    },
    [handleTaskPress],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <ScreenWrapper>
      <Header title="My Tasks" />

      {/* Filter Chips */}
      <View className="px-4 py-3">
        <View className="flex-row gap-2">
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setActiveFilter(option.key)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === option.key
                  ? 'bg-primary border-primary'
                  : 'bg-white border-border'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === option.key ? 'text-white' : 'text-secondary-800'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort Dropdown */}
        <View className="mt-3 flex-row items-center">
          <Text className="text-xs text-muted mr-2">Sort by:</Text>
          <TouchableOpacity
            onPress={() => setShowSortDropdown(!showSortDropdown)}
            className="flex-row items-center px-3 py-1.5 rounded-lg border border-border bg-white"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-secondary-800 mr-1">
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </Text>
            <ChevronDown size={14} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {showSortDropdown && (
          <View className="absolute right-4 top-20 z-10 bg-white rounded-lg border border-border shadow-lg">
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortDropdown(false);
                }}
                className={`px-4 py-3 border-b border-border ${
                  sortBy === option.key ? 'bg-primary/5' : ''
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm ${
                    sortBy === option.key
                      ? 'text-primary font-semibold'
                      : 'text-secondary-800'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={
            activeFilter === 'overdue' ? (
              <AlertTriangle size={48} color={COLORS.muted} />
            ) : (
              <ListChecks size={48} color={COLORS.muted} />
            )
          }
          title={emptyMessages[activeFilter].title}
          description={emptyMessages[activeFilter].description}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
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
