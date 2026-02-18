import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageSquare, Paperclip, Calendar } from 'lucide-react-native';
import type { Task } from '~/types/task';
import { PriorityBadge } from '~/components/ui/badge';
import { Avatar } from '~/components/ui/avatar';
import { COLORS } from '~/lib/constants';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

function formatDueDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isDueOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isDueOverdue(task.dueDate);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-lg border border-border p-3 mb-2 shadow-sm"
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <View
              key={label.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </View>
      )}

      {/* Title */}
      <Text className="text-sm font-medium text-secondary-800 mb-2" numberOfLines={2}>
        {task.title}
      </Text>

      {/* Bottom row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <PriorityBadge priority={task.priority} />

          {dueLabel && (
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color={overdue ? COLORS.danger : COLORS.muted} />
              <Text
                className={`text-xs ${overdue ? 'text-danger font-medium' : 'text-muted'}`}
              >
                {dueLabel}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {(task.commentCount ?? 0) > 0 && (
            <View className="flex-row items-center gap-0.5">
              <MessageSquare size={12} color={COLORS.muted} />
              <Text className="text-xs text-muted">{task.commentCount}</Text>
            </View>
          )}
          {(task.attachmentCount ?? 0) > 0 && (
            <View className="flex-row items-center gap-0.5">
              <Paperclip size={12} color={COLORS.muted} />
              <Text className="text-xs text-muted">{task.attachmentCount}</Text>
            </View>
          )}
          {task.assignee && (
            <Avatar
              name={task.assignee.fullName}
              imageUrl={task.assignee.avatarUrl}
              size="sm"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
