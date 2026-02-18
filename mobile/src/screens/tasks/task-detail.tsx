import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Plus,
  Clock,
  Play,
  StopCircle,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit3,
  Send,
  ChevronDown,
  Calendar,
  User,
  Flag,
  Tag,
  AlignLeft,
  Activity,
  X,
  Download,
  FileText,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import { ScreenWrapper } from '~/components/layout/screen-wrapper';
import { Card } from '~/components/ui/card';
import { Badge, PriorityBadge } from '~/components/ui/badge';
import { Avatar } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { taskService } from '~/services/taskService';
import { commentService } from '~/services/commentService';
import { subTaskService } from '~/services/subTaskService';
import { attachmentService } from '~/services/attachmentService';
import { timeEntryService } from '~/services/timeEntryService';
import { activityService } from '~/services/activityService';
import { memberService } from '~/services/memberService';
import { labelService } from '~/services/labelService';
import { useAuthStore } from '~/store/authStore';
import type {
  Task,
  SubTask,
  Comment,
  Attachment,
  TimeEntry,
  ActivityLog,
  ProjectMember,
  Label,
} from '~/types';
import { COLORS, PRIORITY_COLORS } from '~/lib/constants';

type TaskDetailNav = NativeStackNavigationProp<ProjectStackParamList, 'TaskDetail'>;
type TaskDetailRoute = RouteProp<ProjectStackParamList, 'TaskDetail'>;

const PRIORITIES: Array<Task['priority']> = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

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

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not set';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getActivityActionText(action: string): string {
  const map: Record<string, string> = {
    TASK_CREATED: 'created this task',
    TASK_UPDATED: 'updated this task',
    TASK_MOVED: 'moved this task',
    TASK_DELETED: 'deleted this task',
    TASK_RESTORED: 'restored this task',
    COMMENT_ADDED: 'added a comment',
    ATTACHMENT_ADDED: 'added an attachment',
    ATTACHMENT_REMOVED: 'removed an attachment',
    SUB_TASK_ADDED: 'added a sub-task',
    SUB_TASK_COMPLETED: 'completed a sub-task',
    TIME_LOGGED: 'logged time',
  };
  return map[action] || action.toLowerCase().replace(/_/g, ' ');
}

export function TaskDetailScreen() {
  const navigation = useNavigation<TaskDetailNav>();
  const route = useRoute<TaskDetailRoute>();
  const { projectId, taskId } = route.params;
  const currentUser = useAuthStore((s) => s.user);

  // --- Core State ---
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Title Editing ---
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // --- Description Editing ---
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  // --- Sub Tasks ---
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);

  // --- Comments ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // --- Attachments ---
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- Time Entries ---
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // --- Activity ---
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // --- Members & Labels (for selectors) ---
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);

  // --- Modals ---
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // --- Fetch All Data ---
  const fetchTask = useCallback(async () => {
    try {
      const result = await taskService.getById(projectId, taskId);
      setTask(result);
      setEditTitle(result.title);
      setEditDesc(result.description || '');
    } catch {
      Alert.alert('Error', 'Failed to load task details.');
      navigation.goBack();
    }
  }, [projectId, taskId, navigation]);

  const fetchSubTasks = useCallback(async () => {
    try {
      const result = await subTaskService.list(projectId, taskId);
      setSubTasks(result.sort((a, b) => a.position - b.position));
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const fetchComments = useCallback(async () => {
    try {
      const result = await commentService.list(projectId, taskId);
      setComments(result);
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const fetchAttachments = useCallback(async () => {
    try {
      const result = await attachmentService.list(projectId, taskId);
      setAttachments(result);
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const fetchTimeEntries = useCallback(async () => {
    try {
      const result = await timeEntryService.list(projectId, taskId);
      setTimeEntries(result);

      // Check for an active timer (no endedAt)
      const running = result.find((e) => e.entryType === 'TIMER' && !e.endedAt);
      if (running) {
        setActiveTimer(running);
        const startedMs = new Date(running.startedAt!).getTime();
        setTimerElapsed(Math.floor((Date.now() - startedMs) / 1000));
      }
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const fetchActivities = useCallback(async () => {
    try {
      const result = await activityService.list(projectId, {
        taskId,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      setActivities(result.data);
    } catch {
      // Silently fail
    }
  }, [projectId, taskId]);

  const fetchMembers = useCallback(async () => {
    try {
      const result = await memberService.list(projectId);
      setMembers(result);
    } catch {
      // Silently fail
    }
  }, [projectId]);

  const fetchLabels = useCallback(async () => {
    try {
      const result = await labelService.list(projectId);
      setProjectLabels(result);
    } catch {
      // Silently fail
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTask(),
        fetchSubTasks(),
        fetchComments(),
        fetchAttachments(),
        fetchTimeEntries(),
        fetchActivities(),
        fetchMembers(),
        fetchLabels(),
      ]);
      setIsLoading(false);
    };
    load();
  }, [
    fetchTask,
    fetchSubTasks,
    fetchComments,
    fetchAttachments,
    fetchTimeEntries,
    fetchActivities,
    fetchMembers,
    fetchLabels,
  ]);

  // --- Timer interval ---
  useEffect(() => {
    if (activeTimer) {
      timerIntervalRef.current = setInterval(() => {
        const startedMs = new Date(activeTimer.startedAt!).getTime();
        setTimerElapsed(Math.floor((Date.now() - startedMs) / 1000));
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer]);

  // --- Update Helpers ---
  const updateTask = useCallback(
    async (data: Partial<{ title: string; description: string; assigneeId: string | null; priority: Task['priority']; dueDate: string; labelIds: string[] }>) => {
      if (!task) return;
      setIsSaving(true);
      try {
        const updated = await taskService.update(projectId, taskId, data);
        setTask(updated);
      } catch {
        Alert.alert('Error', 'Failed to update task.');
      } finally {
        setIsSaving(false);
      }
    },
    [task, projectId, taskId],
  );

  // --- Title ---
  const handleSaveTitle = useCallback(async () => {
    if (!editTitle.trim() || editTitle === task?.title) {
      setIsEditingTitle(false);
      return;
    }
    await updateTask({ title: editTitle.trim() });
    setIsEditingTitle(false);
  }, [editTitle, task, updateTask]);

  // --- Description ---
  const handleSaveDesc = useCallback(async () => {
    await updateTask({ description: editDesc });
    setIsEditingDesc(false);
  }, [editDesc, updateTask]);

  // --- Assignee ---
  const handleAssigneeChange = useCallback(
    async (userId: string | null) => {
      setShowAssigneePicker(false);
      await updateTask({ assigneeId: userId });
    },
    [updateTask],
  );

  // --- Priority ---
  const handlePriorityChange = useCallback(
    async (priority: Task['priority']) => {
      setShowPriorityPicker(false);
      await updateTask({ priority });
    },
    [updateTask],
  );

  // --- Labels ---
  const handleToggleLabel = useCallback(
    async (labelId: string) => {
      if (!task) return;
      const currentIds = task.labels?.map((l) => l.id) || [];
      const newIds = currentIds.includes(labelId)
        ? currentIds.filter((id) => id !== labelId)
        : [...currentIds, labelId];
      await updateTask({ labelIds: newIds });
    },
    [task, updateTask],
  );

  // --- Sub Tasks ---
  const handleAddSubTask = useCallback(async () => {
    if (!newSubTaskTitle.trim()) return;
    setIsAddingSubTask(true);
    try {
      await subTaskService.create(projectId, taskId, { title: newSubTaskTitle.trim() });
      setNewSubTaskTitle('');
      await fetchSubTasks();
    } catch {
      Alert.alert('Error', 'Failed to add sub-task.');
    } finally {
      setIsAddingSubTask(false);
    }
  }, [newSubTaskTitle, projectId, taskId, fetchSubTasks]);

  const handleToggleSubTask = useCallback(
    async (subTask: SubTask) => {
      try {
        await subTaskService.update(projectId, taskId, subTask.id, {
          isCompleted: !subTask.isCompleted,
        });
        await fetchSubTasks();
      } catch {
        Alert.alert('Error', 'Failed to update sub-task.');
      }
    },
    [projectId, taskId, fetchSubTasks],
  );

  const handleDeleteSubTask = useCallback(
    async (subTaskId: string) => {
      Alert.alert('Delete Sub-task', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await subTaskService.delete(projectId, taskId, subTaskId);
              await fetchSubTasks();
            } catch {
              Alert.alert('Error', 'Failed to delete sub-task.');
            }
          },
        },
      ]);
    },
    [projectId, taskId, fetchSubTasks],
  );

  // --- Comments ---
  const handlePostComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setIsPostingComment(true);
    try {
      await commentService.create(projectId, taskId, { content: newComment.trim() });
      setNewComment('');
      await fetchComments();
    } catch {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  }, [newComment, projectId, taskId, fetchComments]);

  const handleUpdateComment = useCallback(
    async (commentId: string) => {
      if (!editCommentContent.trim()) return;
      try {
        await commentService.update(projectId, taskId, commentId, {
          content: editCommentContent.trim(),
        });
        setEditingCommentId(null);
        setEditCommentContent('');
        await fetchComments();
      } catch {
        Alert.alert('Error', 'Failed to update comment.');
      }
    },
    [editCommentContent, projectId, taskId, fetchComments],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      Alert.alert('Delete Comment', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentService.delete(projectId, taskId, commentId);
              await fetchComments();
            } catch {
              Alert.alert('Error', 'Failed to delete comment.');
            }
          },
        },
      ]);
    },
    [projectId, taskId, fetchComments],
  );

  // --- Attachments ---
  const handleUploadAttachment = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your media library to upload attachments.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setIsUploading(true);

      const fileName = asset.uri.split('/').pop() || 'attachment';
      const fileType = asset.mimeType || 'application/octet-stream';

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      } as any);

      await attachmentService.upload(projectId, taskId, formData);
      await fetchAttachments();
    } catch {
      Alert.alert('Error', 'Failed to upload attachment.');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, taskId, fetchAttachments]);

  const handleDownloadAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const result = await attachmentService.download(projectId, attachmentId);
        if (result.fileUrl) {
          await Linking.openURL(result.fileUrl);
        }
      } catch {
        Alert.alert('Error', 'Failed to download attachment.');
      }
    },
    [projectId],
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      Alert.alert('Delete Attachment', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await attachmentService.delete(projectId, attachmentId);
              await fetchAttachments();
            } catch {
              Alert.alert('Error', 'Failed to delete attachment.');
            }
          },
        },
      ]);
    },
    [projectId, fetchAttachments],
  );

  // --- Time Entries ---
  const handleStartTimer = useCallback(async () => {
    try {
      const entry = await timeEntryService.start(projectId, taskId);
      setActiveTimer(entry);
      setTimerElapsed(0);
      await fetchTimeEntries();
    } catch {
      Alert.alert('Error', 'Failed to start timer.');
    }
  }, [projectId, taskId, fetchTimeEntries]);

  const handleStopTimer = useCallback(async () => {
    if (!activeTimer) return;
    try {
      await timeEntryService.stop(activeTimer.id);
      setActiveTimer(null);
      setTimerElapsed(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      await fetchTimeEntries();
    } catch {
      Alert.alert('Error', 'Failed to stop timer.');
    }
  }, [activeTimer, fetchTimeEntries]);

  const handleAddManualEntry = useCallback(async () => {
    const mins = parseInt(manualDuration, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid', 'Please enter a valid duration in minutes.');
      return;
    }
    try {
      await timeEntryService.create(projectId, taskId, {
        durationMinutes: mins,
        description: manualDescription.trim() || undefined,
      });
      setManualDuration('');
      setManualDescription('');
      setShowManualEntry(false);
      await fetchTimeEntries();
    } catch {
      Alert.alert('Error', 'Failed to add time entry.');
    }
  }, [manualDuration, manualDescription, projectId, taskId, fetchTimeEntries]);

  const handleDeleteTimeEntry = useCallback(
    async (entryId: string) => {
      Alert.alert('Delete Time Entry', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await timeEntryService.delete(entryId);
              await fetchTimeEntries();
            } catch {
              Alert.alert('Error', 'Failed to delete time entry.');
            }
          },
        },
      ]);
    },
    [fetchTimeEntries],
  );

  // --- Render Loading ---
  if (isLoading || !task) {
    return (
      <ScreenWrapper safeArea={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const totalTimeMinutes = timeEntries
    .filter((e) => e.durationMinutes > 0)
    .reduce((sum, e) => sum + e.durationMinutes, 0);

  const completedSubTasks = subTasks.filter((s) => s.isCompleted).length;

  return (
    <ScreenWrapper safeArea={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Header / Title ---- */}
          <View className="px-4 pt-4 pb-2">
            {isEditingTitle ? (
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 text-xl font-bold text-secondary-800 border-b-2 border-primary pb-1"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  onBlur={handleSaveTitle}
                  onSubmitEditing={handleSaveTitle}
                  autoFocus
                  returnKeyType="done"
                />
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingTitle(true)} activeOpacity={0.7}>
                <Text className="text-xl font-bold text-secondary-800">{task.title}</Text>
              </TouchableOpacity>
            )}
            {isSaving && (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginTop: 4 }}
              />
            )}
          </View>

          {/* ---- Status / Column ---- */}
          <View className="px-4 py-3">
            <Card variant="outlined">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Status</Text>
                <Badge
                  label={task.column?.title || 'Unknown'}
                  color={COLORS.primary}
                  variant="filled"
                  size="md"
                />
              </View>
            </Card>
          </View>

          {/* ---- Assignee ---- */}
          <View className="px-4 py-1">
            <Card variant="outlined">
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => setShowAssigneePicker(true)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <User size={16} color={COLORS.muted} />
                  <Text className="text-sm text-muted ml-2">Assignee</Text>
                </View>
                <View className="flex-row items-center">
                  {task.assignee ? (
                    <>
                      <Avatar
                        name={task.assignee.fullName}
                        imageUrl={task.assignee.avatarUrl}
                        size="sm"
                      />
                      <Text className="text-sm text-secondary-800 ml-2">
                        {task.assignee.fullName}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-sm text-muted">Unassigned</Text>
                  )}
                  <ChevronDown size={14} color={COLORS.muted} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>

          {/* ---- Priority ---- */}
          <View className="px-4 py-1">
            <Card variant="outlined">
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => setShowPriorityPicker(true)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Flag size={16} color={COLORS.muted} />
                  <Text className="text-sm text-muted ml-2">Priority</Text>
                </View>
                <View className="flex-row items-center">
                  <PriorityBadge priority={task.priority} />
                  <ChevronDown size={14} color={COLORS.muted} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>

          {/* ---- Due Date ---- */}
          <View className="px-4 py-1">
            <Card variant="outlined">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Calendar size={16} color={COLORS.muted} />
                  <Text className="text-sm text-muted ml-2">Due Date</Text>
                </View>
                <Text className="text-sm text-secondary-800">{formatDate(task.dueDate)}</Text>
              </View>
            </Card>
          </View>

          {/* ---- Labels ---- */}
          <View className="px-4 py-1">
            <Card variant="outlined">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Tag size={16} color={COLORS.muted} />
                  <Text className="text-sm text-muted ml-2">Labels</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowLabelPicker(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {task.labels && task.labels.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <TouchableOpacity
                      key={label.id}
                      onPress={() => handleToggleLabel(label.id)}
                      activeOpacity={0.7}
                    >
                      <Badge label={label.name} color={label.color} variant="filled" size="md" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-xs text-muted">No labels</Text>
              )}
            </Card>
          </View>

          {/* ---- Description ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <AlignLeft size={16} color={COLORS.muted} />
                <Text className="text-sm font-semibold text-secondary-800 ml-2">
                  Description
                </Text>
              </View>
              {!isEditingDesc && (
                <TouchableOpacity onPress={() => setIsEditingDesc(true)} activeOpacity={0.7}>
                  <Edit3 size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
            {isEditingDesc ? (
              <View>
                <TextInput
                  className="border border-border rounded-lg p-3 text-sm text-secondary-800 bg-white"
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                  placeholderTextColor={COLORS.muted}
                  placeholder="Add a description..."
                />
                <View className="flex-row justify-end mt-2 gap-2">
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setEditDesc(task.description || '');
                      setIsEditingDesc(false);
                    }}
                    variant="outline"
                    size="sm"
                  />
                  <Button title="Save" onPress={handleSaveDesc} variant="primary" size="sm" />
                </View>
              </View>
            ) : (
              <Text className="text-sm text-secondary-800 leading-5">
                {task.description || 'No description provided.'}
              </Text>
            )}
          </View>

          {/* ---- Sub-Tasks ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <CheckSquare size={16} color={COLORS.muted} />
                <Text className="text-sm font-semibold text-secondary-800 ml-2">
                  Sub-tasks ({completedSubTasks}/{subTasks.length})
                </Text>
              </View>
            </View>

            {subTasks.length > 0 && (
              <View className="mb-3">
                <View
                  className="h-1.5 rounded-full bg-gray-200 mb-3"
                >
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${subTasks.length > 0 ? (completedSubTasks / subTasks.length) * 100 : 0}%`,
                      backgroundColor: COLORS.success,
                    }}
                  />
                </View>
              </View>
            )}

            {subTasks.map((st) => (
              <View key={st.id} className="flex-row items-center py-2 border-b border-border">
                <TouchableOpacity onPress={() => handleToggleSubTask(st)} activeOpacity={0.7}>
                  {st.isCompleted ? (
                    <CheckSquare size={20} color={COLORS.success} />
                  ) : (
                    <Square size={20} color={COLORS.muted} />
                  )}
                </TouchableOpacity>
                <Text
                  className={`flex-1 text-sm ml-3 ${
                    st.isCompleted ? 'text-muted line-through' : 'text-secondary-800'
                  }`}
                >
                  {st.title}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSubTask(st.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add sub-task */}
            <View className="flex-row items-center mt-3">
              <TextInput
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white text-secondary-800"
                placeholder="Add a sub-task..."
                placeholderTextColor={COLORS.muted}
                value={newSubTaskTitle}
                onChangeText={setNewSubTaskTitle}
                onSubmitEditing={handleAddSubTask}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddSubTask}
                disabled={isAddingSubTask || !newSubTaskTitle.trim()}
                className="ml-2 p-2 rounded-lg bg-primary"
                activeOpacity={0.7}
              >
                {isAddingSubTask ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Plus size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ---- Time Tracking ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Clock size={16} color={COLORS.muted} />
                <Text className="text-sm font-semibold text-secondary-800 ml-2">
                  Time Tracking
                </Text>
                <Text className="text-xs text-muted ml-2">
                  (Total: {formatDuration(totalTimeMinutes)})
                </Text>
              </View>
            </View>

            {/* Timer Controls */}
            <View className="flex-row items-center gap-2 mb-3">
              {activeTimer ? (
                <>
                  <View className="flex-1 flex-row items-center px-3 py-2 bg-danger/10 rounded-lg">
                    <StopCircle size={16} color={COLORS.danger} />
                    <Text className="text-sm font-mono font-semibold text-danger ml-2">
                      {Math.floor(timerElapsed / 3600)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {Math.floor((timerElapsed % 3600) / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(timerElapsed % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <Button title="Stop" onPress={handleStopTimer} variant="danger" size="sm" />
                </>
              ) : (
                <>
                  <Button
                    title="Start Timer"
                    onPress={handleStartTimer}
                    variant="primary"
                    size="sm"
                    icon={<Play size={14} color="#FFF" />}
                  />
                  <Button
                    title="Manual Entry"
                    onPress={() => setShowManualEntry(!showManualEntry)}
                    variant="outline"
                    size="sm"
                    icon={<Plus size={14} color={COLORS.text} />}
                  />
                </>
              )}
            </View>

            {/* Manual Entry Form */}
            {showManualEntry && (
              <Card variant="outlined" className="mb-3">
                <TextInput
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-secondary-800 mb-2"
                  placeholder="Duration (minutes)"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  value={manualDuration}
                  onChangeText={setManualDuration}
                />
                <TextInput
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-secondary-800 mb-2"
                  placeholder="Description (optional)"
                  placeholderTextColor={COLORS.muted}
                  value={manualDescription}
                  onChangeText={setManualDescription}
                />
                <View className="flex-row justify-end gap-2">
                  <Button
                    title="Cancel"
                    onPress={() => setShowManualEntry(false)}
                    variant="outline"
                    size="sm"
                  />
                  <Button title="Add" onPress={handleAddManualEntry} variant="primary" size="sm" />
                </View>
              </Card>
            )}

            {/* Time Entry List */}
            {timeEntries.map((entry) => (
              <View
                key={entry.id}
                className="flex-row items-center py-2 border-b border-border"
              >
                <Clock size={14} color={COLORS.muted} />
                <View className="flex-1 ml-2">
                  <Text className="text-sm text-secondary-800">
                    {formatDuration(entry.durationMinutes)}
                    {entry.description ? ` - ${entry.description}` : ''}
                  </Text>
                  <Text className="text-xs text-muted">
                    {entry.user?.fullName || 'Unknown'} -- {formatTimeAgo(entry.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteTimeEntry(entry.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ---- Comments ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-3">
              <MessageSquare size={16} color={COLORS.muted} />
              <Text className="text-sm font-semibold text-secondary-800 ml-2">
                Comments ({comments.length})
              </Text>
            </View>

            {comments.map((comment) => (
              <View key={comment.id} className="mb-3 border-b border-border pb-3">
                <View className="flex-row items-start">
                  <Avatar
                    name={comment.user?.fullName}
                    imageUrl={comment.user?.avatarUrl}
                    size="sm"
                  />
                  <View className="flex-1 ml-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-secondary-800">
                        {comment.user?.fullName || 'Unknown'}
                      </Text>
                      <Text className="text-xs text-muted">{formatTimeAgo(comment.createdAt)}</Text>
                    </View>

                    {editingCommentId === comment.id ? (
                      <View className="mt-1">
                        <TextInput
                          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-secondary-800"
                          value={editCommentContent}
                          onChangeText={setEditCommentContent}
                          multiline
                        />
                        <View className="flex-row justify-end mt-1 gap-2">
                          <Button
                            title="Cancel"
                            onPress={() => setEditingCommentId(null)}
                            variant="ghost"
                            size="sm"
                          />
                          <Button
                            title="Save"
                            onPress={() => handleUpdateComment(comment.id)}
                            variant="primary"
                            size="sm"
                          />
                        </View>
                      </View>
                    ) : (
                      <Text className="text-sm text-secondary-800 mt-1">{comment.content}</Text>
                    )}
                  </View>
                </View>

                {/* Comment actions for own comments */}
                {comment.userId === currentUser?.id && editingCommentId !== comment.id && (
                  <View className="flex-row justify-end mt-1 gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingCommentId(comment.id);
                        setEditCommentContent(comment.content);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit3 size={14} color={COLORS.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(comment.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Add Comment */}
            <View className="flex-row items-end mt-1">
              <TextInput
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white text-secondary-800"
                placeholder="Write a comment..."
                placeholderTextColor={COLORS.muted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                style={{ maxHeight: 80 }}
              />
              <TouchableOpacity
                onPress={handlePostComment}
                disabled={isPostingComment || !newComment.trim()}
                className="ml-2 p-2 rounded-lg bg-primary"
                activeOpacity={0.7}
                style={{ opacity: !newComment.trim() ? 0.5 : 1 }}
              >
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Send size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ---- Attachments ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Paperclip size={16} color={COLORS.muted} />
                <Text className="text-sm font-semibold text-secondary-800 ml-2">
                  Attachments ({attachments.length})
                </Text>
              </View>
              <TouchableOpacity onPress={handleUploadAttachment} activeOpacity={0.7}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Plus size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>

            {attachments.map((att) => (
              <View key={att.id} className="flex-row items-center py-2 border-b border-border">
                <FileText size={16} color={COLORS.muted} />
                <View className="flex-1 ml-2">
                  <Text className="text-sm text-secondary-800" numberOfLines={1}>
                    {att.fileName}
                  </Text>
                  <Text className="text-xs text-muted">{formatFileSize(att.fileSize)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDownloadAttachment(att.id)}
                  className="p-1 mr-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Download size={14} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteAttachment(att.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {attachments.length === 0 && (
              <Text className="text-xs text-muted">No attachments yet.</Text>
            )}
          </View>

          {/* ---- Activity Log ---- */}
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-3">
              <Activity size={16} color={COLORS.muted} />
              <Text className="text-sm font-semibold text-secondary-800 ml-2">Activity</Text>
            </View>

            {activities.map((log) => (
              <View key={log.id} className="flex-row items-start py-2 border-b border-border">
                <Avatar
                  name={log.user?.fullName}
                  imageUrl={log.user?.avatarUrl}
                  size="sm"
                />
                <View className="flex-1 ml-2">
                  <Text className="text-sm text-secondary-800">
                    <Text className="font-semibold">{log.user?.fullName || 'Unknown'}</Text>{' '}
                    {getActivityActionText(log.action)}
                  </Text>
                  <Text className="text-xs text-muted">{formatTimeAgo(log.createdAt)}</Text>
                </View>
              </View>
            ))}

            {activities.length === 0 && (
              <Text className="text-xs text-muted">No activity yet.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---- Assignee Picker Modal ---- */}
      <Modal visible={showAssigneePicker} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowAssigneePicker(false)}
        >
          <View className="mt-auto bg-white rounded-t-2xl max-h-[60%]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-base font-semibold text-secondary-800">Select Assignee</Text>
              <TouchableOpacity onPress={() => setShowAssigneePicker(false)}>
                <X size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-border"
              onPress={() => handleAssigneeChange(null)}
              activeOpacity={0.7}
            >
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                <User size={16} color={COLORS.muted} />
              </View>
              <Text className="text-sm text-muted ml-3">Unassigned</Text>
            </TouchableOpacity>

            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`flex-row items-center px-4 py-3 border-b border-border ${
                    task.assigneeId === item.userId ? 'bg-primary/5' : ''
                  }`}
                  onPress={() => handleAssigneeChange(item.userId)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    name={item.user?.fullName}
                    imageUrl={item.user?.avatarUrl}
                    size="sm"
                  />
                  <Text className="text-sm text-secondary-800 ml-3">
                    {item.user?.fullName || item.user?.email}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---- Priority Picker Modal ---- */}
      <Modal visible={showPriorityPicker} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowPriorityPicker(false)}
        >
          <View className="mt-auto bg-white rounded-t-2xl">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-base font-semibold text-secondary-800">Select Priority</Text>
              <TouchableOpacity onPress={() => setShowPriorityPicker(false)}>
                <X size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                className={`flex-row items-center px-4 py-3 border-b border-border ${
                  task.priority === p ? 'bg-primary/5' : ''
                }`}
                onPress={() => handlePriorityChange(p)}
                activeOpacity={0.7}
              >
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: PRIORITY_COLORS[p] }}
                />
                <Text className="text-sm text-secondary-800">{p}</Text>
                {task.priority === p && (
                  <Text className="text-xs text-primary ml-auto">Current</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ---- Label Picker Modal ---- */}
      <Modal visible={showLabelPicker} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowLabelPicker(false)}
        >
          <View className="mt-auto bg-white rounded-t-2xl max-h-[60%]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-base font-semibold text-secondary-800">Toggle Labels</Text>
              <TouchableOpacity onPress={() => setShowLabelPicker(false)}>
                <X size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={projectLabels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = task.labels?.some((l) => l.id === item.id);
                return (
                  <TouchableOpacity
                    className={`flex-row items-center px-4 py-3 border-b border-border ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onPress={() => handleToggleLabel(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-4 h-4 rounded-sm mr-3"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="flex-1 text-sm text-secondary-800">{item.name}</Text>
                    {isSelected && (
                      <CheckSquare size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="p-4">
                  <Text className="text-sm text-muted text-center">
                    No labels in this project yet.
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}
