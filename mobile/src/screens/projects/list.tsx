import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  X,
  Plus,
  FolderKanban,
  Calendar,
  Users,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import type { Project } from '~/types/project';
import type { PaginatedResponse } from '~/types/common';
import { projectService } from '~/services/projectService';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { EmptyState } from '~/components/ui/empty-state';
import { COLORS, PROJECT_STATUS_COLORS } from '~/lib/constants';

type Nav = NativeStackNavigationProp<ProjectStackParamList, 'ProjectList'>;

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ARCHIVED', label: 'Archived' },
];

export function ProjectListScreen() {
  const navigation = useNavigation<Nav>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchProjects = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        if (refresh) setIsRefreshing(true);
        else if (pageNum === 1) setIsLoading(true);

        const params: Record<string, unknown> = {
          page: pageNum,
          limit: 20,
          search: searchQuery || undefined,
          status: activeTab !== 'ALL' ? activeTab : undefined,
        };

        const response: PaginatedResponse<Project> =
          await projectService.list(params);

        if (pageNum === 1) {
          setProjects(response.data);
        } else {
          setProjects((prev) => [...prev, ...response.data]);
        }

        setPage(pageNum);
        setHasMore(response.meta.hasNextPage);
      } catch (error) {
        console.warn('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, activeTab],
  );

  useFocusEffect(
    useCallback(() => {
      fetchProjects(1, false);
    }, [fetchProjects]),
  );

  useEffect(() => {
    fetchProjects(1, false);
  }, [activeTab, searchQuery]);

  const handleRefresh = () => {
    fetchProjects(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchProjects(page + 1);
    }
  };

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays <= 7) return { text: `${diffDays}d left`, isOverdue: false };
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isOverdue: false,
    };
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const deadline = formatDeadline(item.deadline);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Board', {
            projectId: item.id,
            projectTitle: item.title,
          })
        }
        className="mx-4 mb-3"
      >
        <Card>
          <View className="flex-row items-start justify-between mb-2">
            <Text
              className="text-base font-semibold text-secondary-800 flex-1 mr-2"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Badge
              label={item.status}
              color={PROJECT_STATUS_COLORS[item.status]}
              variant="filled"
              size="sm"
            />
          </View>

          {item.description ? (
            <Text className="text-sm text-muted mb-3" numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View className="flex-row items-center">
            {deadline && (
              <View className="flex-row items-center mr-4">
                <Calendar
                  size={14}
                  color={deadline.isOverdue ? COLORS.danger : COLORS.muted}
                />
                <Text
                  className={`text-xs ml-1 ${
                    deadline.isOverdue ? 'text-danger' : 'text-muted'
                  }`}
                >
                  {deadline.text}
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <Users size={14} color={COLORS.muted} />
              <Text className="text-xs text-muted ml-1">
                {item.template === 'CUSTOM' ? 'Custom' : item.template}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Title Row */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-2xl font-bold text-secondary-800">Projects</Text>
        <TouchableOpacity
          onPress={() => setSearchVisible((v) => !v)}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {searchVisible ? (
            <X size={22} color={COLORS.muted} />
          ) : (
            <Search size={22} color={COLORS.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View className="mx-4 mb-3">
          <View className="flex-row items-center border border-border rounded-lg px-3 bg-white">
            <Search size={18} color={COLORS.muted} />
            <TextInput
              className="flex-1 py-2.5 ml-2 text-sm text-secondary-800"
              placeholder="Search projects..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View className="flex-row px-4 mb-3">
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`mr-2 px-4 py-2 rounded-full ${
              activeTab === tab.key ? 'bg-primary' : 'bg-white border border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? 'text-white' : 'text-muted'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        icon={<FolderKanban size={48} color={COLORS.muted} />}
        title="No projects found"
        description={
          searchQuery
            ? 'Try adjusting your search or filters'
            : 'Create your first project to get started'
        }
        actionLabel={!searchQuery ? 'Create Project' : undefined}
        onAction={
          !searchQuery
            ? () => navigation.navigate('NewProject')
            : undefined
        }
      />
    );
  };

  return (
    <ScreenWrapper>
      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={
          projects.length === 0 ? { flexGrow: 1 } : { paddingBottom: 100 }
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('NewProject')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: COLORS.primary, elevation: 5 }}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
