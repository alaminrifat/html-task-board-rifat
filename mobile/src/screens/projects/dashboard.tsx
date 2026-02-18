import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  CheckCircle2,
  ListTodo,
  AlertCircle,
  Users,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import {
  dashboardService,
  type DashboardSummary,
  type DashboardCharts,
  type MemberWorkload,
} from '~/services/dashboardService';
import { Card } from '~/components/ui/card';
import { Avatar } from '~/components/ui/avatar';
import { COLORS, PRIORITY_COLORS } from '~/lib/constants';

type Route = RouteProp<ProjectStackParamList, 'ProjectDashboard'>;

const STATUS_COLORS: Record<string, string> = {
  'To Do': '#6B7280',
  'In Progress': '#3B82F6',
  Review: '#F59E0B',
  Done: '#10B981',
};

export function ProjectDashboardScreen() {
  const route = useRoute<Route>();
  const { projectId } = route.params;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [summaryData, chartsData] = await Promise.all([
        dashboardService.summary(projectId),
        dashboardService.charts(projectId),
      ]);
      setSummary(summaryData);
      setCharts(chartsData);
    } catch (error) {
      console.warn('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-sm text-muted mt-3">Loading dashboard...</Text>
      </View>
    );
  }

  const summaryCards = summary
    ? [
        {
          label: 'Total Tasks',
          value: summary.totalTasks,
          icon: <ListTodo size={22} color={COLORS.primary} />,
          bg: COLORS.primaryLight,
        },
        {
          label: 'Completed',
          value: summary.completedTasks,
          icon: <CheckCircle2 size={22} color={COLORS.success} />,
          bg: '#D1FAE5',
        },
        {
          label: 'Overdue',
          value: summary.overdueTasks,
          icon: <AlertCircle size={22} color={COLORS.danger} />,
          bg: '#FEE2E2',
        },
        {
          label: 'Members',
          value: summary.totalMembers,
          icon: <Users size={22} color={COLORS.info} />,
          bg: '#DBEAFE',
        },
      ]
    : [];

  // For chart placeholders, compute max values for simple bar rendering
  const tasksByPriority = charts?.tasksByPriority || {};
  const tasksByStatus = charts?.tasksByStatus || {};
  const maxPriority = Math.max(...Object.values(tasksByPriority), 1);
  const maxStatus = Math.max(...Object.values(tasksByStatus), 1);
  const workload = charts?.memberWorkload || [];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Summary Cards */}
      <View className="flex-row flex-wrap -mx-1.5 mb-4">
        {summaryCards.map((card) => (
          <View key={card.label} className="w-1/2 px-1.5 mb-3">
            <Card>
              <View className="flex-row items-center mb-2">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: card.bg }}
                >
                  {card.icon}
                </View>
                <View>
                  <Text className="text-2xl font-bold text-secondary-800">
                    {card.value}
                  </Text>
                  <Text className="text-xs text-muted">{card.label}</Text>
                </View>
              </View>
            </Card>
          </View>
        ))}
      </View>

      {/* Tasks by Priority (Pie chart placeholder as horizontal bars) */}
      <Card className="mb-4">
        <Text className="text-base font-semibold text-secondary-800 mb-4">
          Tasks by Priority
        </Text>
        {Object.keys(tasksByPriority).length === 0 ? (
          <Text className="text-sm text-muted text-center py-4">
            No data available
          </Text>
        ) : (
          Object.entries(tasksByPriority).map(([priority, count]) => (
            <View key={priority} className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-medium text-secondary-800">
                  {priority}
                </Text>
                <Text className="text-xs text-muted">{count}</Text>
              </View>
              <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / maxPriority) * 100}%`,
                    backgroundColor:
                      PRIORITY_COLORS[
                        priority as keyof typeof PRIORITY_COLORS
                      ] || COLORS.muted,
                  }}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Tasks by Status (Bar chart placeholder) */}
      <Card className="mb-4">
        <Text className="text-base font-semibold text-secondary-800 mb-4">
          Tasks by Status
        </Text>
        {Object.keys(tasksByStatus).length === 0 ? (
          <Text className="text-sm text-muted text-center py-4">
            No data available
          </Text>
        ) : (
          <View className="flex-row items-end justify-around" style={{ height: 120 }}>
            {Object.entries(tasksByStatus).map(([status, count]) => (
              <View key={status} className="items-center flex-1 mx-1">
                <Text className="text-xs font-bold text-secondary-800 mb-1">
                  {count}
                </Text>
                <View
                  className="w-full rounded-t-md"
                  style={{
                    height: Math.max((count / maxStatus) * 90, 4),
                    backgroundColor:
                      STATUS_COLORS[status] || COLORS.primary,
                  }}
                />
                <Text
                  className="text-[10px] text-muted mt-1 text-center"
                  numberOfLines={1}
                >
                  {status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Member Workload */}
      <Card>
        <Text className="text-base font-semibold text-secondary-800 mb-4">
          Member Workload
        </Text>
        {workload.length === 0 ? (
          <Text className="text-sm text-muted text-center py-4">
            No members assigned
          </Text>
        ) : (
          workload.map((member: MemberWorkload) => (
            <View
              key={member.userId}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
            >
              <Avatar
                name={member.name}
                imageUrl={member.avatarUrl || undefined}
                size="md"
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-secondary-800">
                  {member.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-xs text-muted">
                    {member.assignedTasks} assigned
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-muted mx-2" />
                  <Text className="text-xs text-muted">
                    {member.completedTasks} completed
                  </Text>
                </View>
              </View>
              {/* Completion indicator */}
              <View className="items-end">
                <Text className="text-sm font-semibold text-secondary-800">
                  {member.assignedTasks > 0
                    ? Math.round(
                        (member.completedTasks / member.assignedTasks) * 100,
                      )
                    : 0}
                  %
                </Text>
                <Text className="text-[10px] text-muted">complete</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
