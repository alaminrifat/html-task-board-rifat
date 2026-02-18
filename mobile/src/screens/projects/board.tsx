import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Plus,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  CalendarDays,
  Settings,
  BarChart3,
  CalendarRange,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import type { Task } from '~/types/task';
import type { Column } from '~/types/column';
import { projectService } from '~/services/projectService';
import { taskService } from '~/services/taskService';
import { columnService } from '~/services/columnService';
import { useBoardStore } from '~/store/boardStore';
import { useSocket } from '~/hooks/useSocket';
import { Card } from '~/components/ui/card';
import { Badge, PriorityBadge } from '~/components/ui/badge';
import { Avatar } from '~/components/ui/avatar';
import { EmptyState } from '~/components/ui/empty-state';
import { COLORS, PRIORITY_COLORS } from '~/lib/constants';

type Nav = NativeStackNavigationProp<ProjectStackParamList, 'Board'>;
type Route = RouteProp<ProjectStackParamList, 'Board'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_WIDTH = SCREEN_WIDTH * 0.8;

export function BoardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { projectId, projectTitle } = route.params;

  const { columns, tasks, isLoading, setBoard, setLoading, reset } =
    useBoardStore();

  const { emitCreateTask } = useSocket(projectId);

  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(
    null,
  );
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [columnMenuId, setColumnMenuId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const newTaskInputRef = useRef<TextInput>(null);

  // Configure header with action buttons
  useEffect(() => {
    navigation.setOptions({
      title: projectTitle,
      headerRight: () => (
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ProjectDashboard', {
                projectId,
                projectTitle,
              })
            }
            className="p-2"
          >
            <BarChart3 size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Calendar', { projectId, projectTitle })
            }
            className="p-2"
          >
            <CalendarRange size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ProjectSettings', {
                projectId,
                projectTitle,
              })
            }
            className="p-2"
          >
            <Settings size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Trash', { projectId, projectTitle })
            }
            className="p-2"
          >
            <Trash2 size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, projectId, projectTitle]);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);

      const [columnsData, tasksResponse] = await Promise.all([
        columnService.list(projectId),
        taskService.list(projectId, { limit: 200 }),
      ]);

      // Sort columns by position
      const sortedColumns = [...columnsData].sort(
        (a, b) => a.position - b.position,
      );

      // Group tasks by column
      const tasksByColumn: Record<string, Task[]> = {};
      for (const col of sortedColumns) {
        tasksByColumn[col.id] = [];
      }
      for (const task of tasksResponse.data) {
        if (tasksByColumn[task.columnId]) {
          tasksByColumn[task.columnId].push(task);
        }
      }
      // Sort tasks within each column by position
      for (const colId of Object.keys(tasksByColumn)) {
        tasksByColumn[colId].sort((a, b) => a.position - b.position);
      }

      setBoard(sortedColumns, tasksByColumn);
    } catch (error) {
      console.warn('Failed to fetch board:', error);
    }
  }, [projectId, setBoard, setLoading]);

  useEffect(() => {
    fetchBoard();
    return () => {
      reset();
    };
  }, [fetchBoard, reset]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBoard();
    setIsRefreshing(false);
  };

  const handleAddTask = async (columnId: string) => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      setAddingTaskColumnId(null);
      setNewTaskTitle('');
      return;
    }

    try {
      await taskService.create(projectId, {
        title: trimmed,
        columnId,
      });
      setNewTaskTitle('');
      setAddingTaskColumnId(null);
      // Real-time update via websocket; fallback refresh
      await fetchBoard();
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to create task');
    }
  };

  const handleDeleteColumn = (columnId: string, columnTitle: string) => {
    setColumnMenuId(null);
    Alert.alert(
      'Delete Column',
      `Are you sure you want to delete "${columnTitle}"? All tasks in this column will be moved to the first column.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await columnService.delete(projectId, columnId);
              await fetchBoard();
            } catch (error: unknown) {
              const err = error as { message?: string };
              Alert.alert('Error', err?.message || 'Failed to delete column');
            }
          },
        },
      ],
    );
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('TaskDetail', {
          projectId,
          taskId: task.id,
        })
      }
      className="mb-2"
    >
      <Card>
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <View className="flex-row flex-wrap mb-2">
            {task.labels.map((label) => (
              <View
                key={label.id}
                className="px-2 py-0.5 rounded-full mr-1 mb-1"
                style={{ backgroundColor: label.color + '25' }}
              >
                <Text className="text-[10px] font-medium" style={{ color: label.color }}>
                  {label.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Title */}
        <Text
          className="text-sm font-medium text-secondary-800 mb-2"
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Bottom Row: Priority, Assignee, Meta */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <PriorityBadge priority={task.priority} />

            {/* Due Date */}
            {task.dueDate && (
              <View className="flex-row items-center ml-2">
                <CalendarDays size={12} color={COLORS.muted} />
                <Text className="text-[10px] text-muted ml-0.5">
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            {/* Comment count */}
            {(task.commentCount ?? 0) > 0 && (
              <View className="flex-row items-center mr-2">
                <MessageSquare size={12} color={COLORS.muted} />
                <Text className="text-[10px] text-muted ml-0.5">
                  {task.commentCount}
                </Text>
              </View>
            )}

            {/* Attachment count */}
            {(task.attachmentCount ?? 0) > 0 && (
              <View className="flex-row items-center mr-2">
                <Paperclip size={12} color={COLORS.muted} />
                <Text className="text-[10px] text-muted ml-0.5">
                  {task.attachmentCount}
                </Text>
              </View>
            )}

            {/* Assignee */}
            {task.assignee && (
              <Avatar
                name={task.assignee.fullName}
                imageUrl={task.assignee.avatarUrl}
                size="sm"
              />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderColumn = ({
    item: column,
  }: {
    item: Column;
  }) => {
    const columnTasks = tasks[column.id] || [];
    const taskCount = columnTasks.length;
    const isOverWip =
      column.wipLimit != null &&
      column.wipLimit > 0 &&
      taskCount > column.wipLimit;
    const isAdding = addingTaskColumnId === column.id;

    return (
      <View
        className="mr-3 rounded-xl bg-gray-50 border border-border"
        style={{ width: COLUMN_WIDTH }}
      >
        {/* Column Header */}
        <View className="flex-row items-center justify-between px-3 py-3 border-b border-border">
          <View className="flex-row items-center flex-1">
            <Text
              className="text-sm font-semibold text-secondary-800"
              numberOfLines={1}
            >
              {column.title}
            </Text>
            <View className="ml-2 bg-gray-200 rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-muted">
                {taskCount}
              </Text>
            </View>
            {/* WIP indicator */}
            {column.wipLimit != null && column.wipLimit > 0 && (
              <View
                className={`ml-1.5 flex-row items-center px-1.5 py-0.5 rounded-full ${
                  isOverWip ? 'bg-danger/10' : 'bg-gray-100'
                }`}
              >
                {isOverWip && (
                  <AlertTriangle
                    size={10}
                    color={COLORS.danger}
                    style={{ marginRight: 2 }}
                  />
                )}
                <Text
                  className={`text-[10px] font-medium ${
                    isOverWip ? 'text-danger' : 'text-muted'
                  }`}
                >
                  WIP: {taskCount}/{column.wipLimit}
                </Text>
              </View>
            )}
          </View>

          {/* Column menu */}
          <TouchableOpacity
            onPress={() =>
              setColumnMenuId(
                columnMenuId === column.id ? null : column.id,
              )
            }
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreHorizontal size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Column Menu Dropdown */}
        {columnMenuId === column.id && (
          <View className="absolute right-2 top-12 z-50 bg-white rounded-lg shadow-lg border border-border py-1 w-36">
            <TouchableOpacity
              className="px-4 py-2.5"
              onPress={() => {
                setColumnMenuId(null);
                Alert.prompt?.(
                  'Rename Column',
                  'Enter new column title',
                  async (newTitle: string) => {
                    if (newTitle?.trim()) {
                      try {
                        await columnService.update(projectId, column.id, {
                          title: newTitle.trim(),
                        });
                        await fetchBoard();
                      } catch (e) {
                        console.warn('Failed to rename column:', e);
                      }
                    }
                  },
                  'plain-text',
                  column.title,
                ) ??
                  Alert.alert('Edit', 'Column editing is available on iOS');
              }}
            >
              <Text className="text-sm text-secondary-800">Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2.5"
              onPress={() => handleDeleteColumn(column.id, column.title)}
            >
              <Text className="text-sm text-danger">Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tasks List */}
        <FlatList
          data={columnTasks}
          renderItem={({ item }) => renderTaskCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Dimensions.get('window').height - 240 }}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-xs text-muted">No tasks yet</Text>
            </View>
          }
        />

        {/* Add Task */}
        <View className="px-2 pb-2">
          {isAdding ? (
            <View className="flex-row items-center bg-white rounded-lg border border-primary px-2">
              <TextInput
                ref={newTaskInputRef}
                className="flex-1 py-2.5 text-sm text-secondary-800"
                placeholder="Task title..."
                placeholderTextColor={COLORS.muted}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                onSubmitEditing={() => handleAddTask(column.id)}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => {
                  setAddingTaskColumnId(null);
                  setNewTaskTitle('');
                }}
                className="p-1"
              >
                <X size={16} color={COLORS.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAddTask(column.id)}
                className="p-1 ml-1"
              >
                <Plus size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setAddingTaskColumnId(column.id);
                setNewTaskTitle('');
              }}
              className="flex-row items-center justify-center py-2 rounded-lg bg-white border border-dashed border-border"
            >
              <Plus size={16} color={COLORS.muted} />
              <Text className="text-xs text-muted ml-1">Add Task</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading && columns.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-sm text-muted mt-3">Loading board...</Text>
      </View>
    );
  }

  if (!isLoading && columns.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          title="No columns yet"
          description="This board has no columns. Add columns in project settings to get started."
          actionLabel="Go to Settings"
          onAction={() =>
            navigation.navigate('ProjectSettings', {
              projectId,
              projectTitle,
            })
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Close column menus on tap */}
      {columnMenuId && (
        <TouchableOpacity
          className="absolute inset-0 z-40"
          activeOpacity={1}
          onPress={() => setColumnMenuId(null)}
        />
      )}

      {/* Horizontal Column List */}
      <FlatList
        data={columns}
        renderItem={renderColumn}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 12 }}
        snapToInterval={COLUMN_WIDTH + 12}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
}
