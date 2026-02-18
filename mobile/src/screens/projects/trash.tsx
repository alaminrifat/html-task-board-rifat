import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  Trash2,
  RotateCcw,
  CalendarDays,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import type { Task } from '~/types/task';
import { taskService } from '~/services/taskService';
import { Card } from '~/components/ui/card';
import { PriorityBadge } from '~/components/ui/badge';
import { EmptyState } from '~/components/ui/empty-state';
import { COLORS } from '~/lib/constants';

type Route = RouteProp<ProjectStackParamList, 'Trash'>;

export function TrashScreen() {
  const route = useRoute<Route>();
  const { projectId } = route.params;

  const [trashedTasks, setTrashedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTrash = useCallback(async () => {
    try {
      const data = await taskService.listTrash(projectId);
      setTrashedTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch trash:', error);
      setTrashedTasks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrash();
  };

  const handleRestore = (task: Task) => {
    Alert.alert('Restore Task', `Restore "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          try {
            await taskService.restore(projectId, task.id);
            setTrashedTasks((prev) => prev.filter((t) => t.id !== task.id));
          } catch (error: unknown) {
            const err = error as { message?: string };
            Alert.alert('Error', err?.message || 'Failed to restore task');
          }
        },
      },
    ]);
  };

  const handlePermanentDelete = (task: Task) => {
    Alert.alert(
      'Delete Permanently',
      `This will permanently delete "${task.title}". This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.permanentDelete(projectId, task.id);
              setTrashedTasks((prev) => prev.filter((t) => t.id !== task.id));
            } catch (error: unknown) {
              const err = error as { message?: string };
              Alert.alert('Error', err?.message || 'Failed to delete task');
            }
          },
        },
      ],
    );
  };

  const renderLeftActions = (task: Task) => (
    <TouchableOpacity
      onPress={() => handleRestore(task)}
      className="justify-center items-center px-6 rounded-l-xl"
      style={{ backgroundColor: COLORS.success }}
    >
      <RotateCcw size={20} color="#FFFFFF" />
      <Text className="text-xs text-white font-medium mt-1">Restore</Text>
    </TouchableOpacity>
  );

  const renderRightActions = (task: Task) => (
    <TouchableOpacity
      onPress={() => handlePermanentDelete(task)}
      className="justify-center items-center px-6 rounded-r-xl"
      style={{ backgroundColor: COLORS.danger }}
    >
      <Trash2 size={20} color="#FFFFFF" />
      <Text className="text-xs text-white font-medium mt-1">Delete</Text>
    </TouchableOpacity>
  );

  const formatDeletedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable
      renderLeftActions={() => renderLeftActions(item)}
      renderRightActions={() => renderRightActions(item)}
      overshootLeft={false}
      overshootRight={false}
    >
      <View className="mx-4 mb-2">
        <Card>
          <View className="flex-row items-start">
            <View className="flex-1">
              <Text
                className="text-sm font-medium text-secondary-800 mb-1"
                numberOfLines={2}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text className="text-xs text-muted mb-2" numberOfLines={1}>
                  {item.description}
                </Text>
              ) : null}
              <View className="flex-row items-center">
                <PriorityBadge priority={item.priority} />
                {item.column && (
                  <Text className="text-xs text-muted ml-2">
                    from: {item.column.title}
                  </Text>
                )}
              </View>
            </View>

            <View className="items-end ml-3">
              {item.deletedAt && (
                <View className="flex-row items-center">
                  <CalendarDays size={12} color={COLORS.muted} />
                  <Text className="text-[10px] text-muted ml-1">
                    {formatDeletedDate(item.deletedAt)}
                  </Text>
                </View>
              )}
              {/* Quick action buttons for non-swipe users */}
              <View className="flex-row mt-2">
                <TouchableOpacity
                  onPress={() => handleRestore(item)}
                  className="p-1.5 rounded-md mr-1"
                  style={{ backgroundColor: COLORS.success + '15' }}
                >
                  <RotateCcw size={14} color={COLORS.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePermanentDelete(item)}
                  className="p-1.5 rounded-md"
                  style={{ backgroundColor: COLORS.danger + '15' }}
                >
                  <Trash2 size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </Swipeable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-sm text-muted mt-3">Loading trash...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Swipe hint */}
      {trashedTasks.length > 0 && (
        <View className="px-4 py-2 bg-gray-50 border-b border-border">
          <Text className="text-xs text-muted text-center">
            Swipe right to restore, swipe left to delete permanently
          </Text>
        </View>
      )}

      <FlatList
        data={trashedTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          trashedTasks.length === 0
            ? { flexGrow: 1 }
            : { paddingTop: 8, paddingBottom: 24 }
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Trash2 size={48} color={COLORS.muted} />}
            title="Trash is empty"
            description="Deleted tasks will appear here. You can restore or permanently delete them."
          />
        }
      />
    </View>
  );
}
