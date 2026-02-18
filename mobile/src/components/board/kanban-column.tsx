import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Plus, MoreHorizontal, AlertTriangle } from 'lucide-react-native';
import type { Task } from '~/types/task';
import type { Column } from '~/types/column';
import { TaskCard } from './task-card';
import { COLORS } from '~/lib/constants';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onColumnMenu?: (column: Column) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onTaskPress,
  onAddTask,
  onColumnMenu,
}: KanbanColumnProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const isAtWipLimit = column.wipLimit ? tasks.length >= column.wipLimit : false;
  const isOverWipLimit = column.wipLimit ? tasks.length > column.wipLimit : false;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowAddInput(false);
    }
  };

  return (
    <View
      className="bg-background rounded-xl mr-3"
      style={{ width: 280 }}
    >
      {/* Column Header */}
      <View className="flex-row items-center justify-between px-3 py-3">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-sm font-semibold text-secondary-800" numberOfLines={1}>
            {column.title}
          </Text>
          <View className="bg-secondary-200 rounded-full px-2 py-0.5">
            <Text className="text-xs font-medium text-secondary-600">{tasks.length}</Text>
          </View>
          {column.wipLimit && (
            <Text className={`text-xs ${isOverWipLimit ? 'text-danger' : 'text-muted'}`}>
              / {column.wipLimit}
            </Text>
          )}
          {isOverWipLimit && <AlertTriangle size={14} color={COLORS.danger} />}
        </View>
        {onColumnMenu && (
          <TouchableOpacity onPress={() => onColumnMenu(column)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreHorizontal size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tasks */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-2">
            <TaskCard task={item} onPress={() => onTaskPress(item)} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 500 }}
      />

      {/* Add Task */}
      <View className="px-2 pb-3">
        {showAddInput ? (
          <View className="bg-white rounded-lg border border-border p-2">
            <TextInput
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Enter task title..."
              placeholderTextColor={COLORS.muted}
              className="text-sm text-secondary-800 mb-2"
              autoFocus
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleAddTask}
                className="bg-primary rounded px-3 py-1.5"
              >
                <Text className="text-xs font-medium text-white">Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddInput(false);
                  setNewTaskTitle('');
                }}
                className="px-3 py-1.5"
              >
                <Text className="text-xs text-muted">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowAddInput(true)}
            className="flex-row items-center gap-1 py-2 px-1"
            disabled={isAtWipLimit}
          >
            <Plus size={16} color={isAtWipLimit ? COLORS.border : COLORS.muted} />
            <Text className={`text-sm ${isAtWipLimit ? 'text-border' : 'text-muted'}`}>
              Add a card
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
