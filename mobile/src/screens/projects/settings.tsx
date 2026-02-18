import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Settings,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Archive,
  AlertTriangle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

import type { ProjectStackParamList } from '~/navigation/project-stack';
import type { Project } from '~/types/project';
import type { Column } from '~/types/column';
import type { Label } from '~/types/label';
import type { ProjectMember } from '~/types/member';
import { projectService } from '~/services/projectService';
import { columnService } from '~/services/columnService';
import { labelService } from '~/services/labelService';
import { memberService } from '~/services/memberService';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Avatar } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { COLORS } from '~/lib/constants';

type Nav = NativeStackNavigationProp<ProjectStackParamList, 'ProjectSettings'>;
type Route = RouteProp<ProjectStackParamList, 'ProjectSettings'>;

const LABEL_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#6B7280',
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
}: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between py-3 px-4 bg-white rounded-t-xl border border-border"
        style={!expanded ? { borderRadius: 12 } : undefined}
      >
        <Text className="text-base font-semibold text-secondary-800">
          {title}
        </Text>
        {expanded ? (
          <ChevronUp size={18} color={COLORS.muted} />
        ) : (
          <ChevronDown size={18} color={COLORS.muted} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View className="bg-white border-x border-b border-border rounded-b-xl px-4 pb-4">
          {children}
        </View>
      )}
    </View>
  );
}

export function ProjectSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { projectId, projectTitle } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // General form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Column form state
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');

  // Label form state
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState('');

  // Member invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [projectData, columnsData, labelsData, membersData] =
        await Promise.all([
          projectService.getById(projectId),
          columnService.list(projectId),
          labelService.list(projectId),
          memberService.list(projectId),
        ]);
      setProject(projectData);
      setEditTitle(projectData.title);
      setEditDescription(projectData.description || '');
      setColumns([...columnsData].sort((a, b) => a.position - b.position));
      setLabels(labelsData);
      setMembers(membersData);
    } catch (error) {
      console.warn('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- General ---
  const handleSaveGeneral = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Project title is required');
      return;
    }
    setIsSavingGeneral(true);
    try {
      await projectService.update(projectId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      Alert.alert('Success', 'Project updated');
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to update project');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // --- Columns ---
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      await columnService.create(projectId, { title: newColumnTitle.trim() });
      setNewColumnTitle('');
      const updated = await columnService.list(projectId);
      setColumns([...updated].sort((a, b) => a.position - b.position));
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to add column');
    }
  };

  const handleUpdateColumn = async (columnId: string) => {
    if (!editingColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }
    try {
      await columnService.update(projectId, columnId, {
        title: editingColumnTitle.trim(),
      });
      setEditingColumnId(null);
      const updated = await columnService.list(projectId);
      setColumns([...updated].sort((a, b) => a.position - b.position));
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to update column');
    }
  };

  const handleDeleteColumn = (columnId: string, title: string) => {
    Alert.alert('Delete Column', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await columnService.delete(projectId, columnId);
            const updated = await columnService.list(projectId);
            setColumns([...updated].sort((a, b) => a.position - b.position));
          } catch (error: unknown) {
            const err = error as { message?: string };
            Alert.alert('Error', err?.message || 'Failed to delete column');
          }
        },
      },
    ]);
  };

  const handleReorderColumn = async (
    columnId: string,
    direction: 'up' | 'down',
  ) => {
    const idx = columns.findIndex((c) => c.id === columnId);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === columns.length - 1)
    )
      return;

    const newOrder = [...columns];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    setColumns(newOrder);
    try {
      await columnService.reorder(projectId, {
        columnIds: newOrder.map((c) => c.id),
      });
    } catch (error) {
      console.warn('Failed to reorder columns:', error);
      const updated = await columnService.list(projectId);
      setColumns([...updated].sort((a, b) => a.position - b.position));
    }
  };

  // --- Labels ---
  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      await labelService.create(projectId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setNewLabelName('');
      setShowAddLabel(false);
      const updated = await labelService.list(projectId);
      setLabels(updated);
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to add label');
    }
  };

  const handleUpdateLabel = async (labelId: string) => {
    if (!editingLabelName.trim()) {
      setEditingLabelId(null);
      return;
    }
    try {
      await labelService.update(projectId, labelId, {
        name: editingLabelName.trim(),
        color: editingLabelColor,
      });
      setEditingLabelId(null);
      const updated = await labelService.list(projectId);
      setLabels(updated);
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to update label');
    }
  };

  const handleDeleteLabel = (labelId: string, name: string) => {
    Alert.alert('Delete Label', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await labelService.delete(projectId, labelId);
            const updated = await labelService.list(projectId);
            setLabels(updated);
          } catch (error: unknown) {
            const err = error as { message?: string };
            Alert.alert('Error', err?.message || 'Failed to delete label');
          }
        },
      },
    ]);
  };

  // --- Members ---
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await memberService.invite(projectId, { email: inviteEmail.trim() });
      setInviteEmail('');
      Alert.alert('Success', 'Invitation sent');
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert('Error', err?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = (userId: string, name: string) => {
    Alert.alert('Remove Member', `Remove ${name} from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await memberService.remove(projectId, userId);
            const updated = await memberService.list(projectId);
            setMembers(updated);
          } catch (error: unknown) {
            const err = error as { message?: string };
            Alert.alert('Error', err?.message || 'Failed to remove member');
          }
        },
      },
    ]);
  };

  // --- Danger Zone ---
  const handleArchive = () => {
    Alert.alert(
      'Archive Project',
      'Are you sure you want to archive this project? It can be unarchived later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await projectService.archive(projectId);
              navigation.goBack();
            } catch (error: unknown) {
              const err = error as { message?: string };
              Alert.alert(
                'Error',
                err?.message || 'Failed to archive project',
              );
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'This action is permanent and cannot be undone. All tasks, columns, and data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.delete(projectId);
              navigation.navigate('ProjectList');
            } catch (error: unknown) {
              const err = error as { message?: string };
              Alert.alert(
                'Error',
                err?.message || 'Failed to delete project',
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* General */}
      <CollapsibleSection title="General" defaultExpanded>
        <View className="pt-3">
          <Input
            label="Project Title"
            value={editTitle}
            onChangeText={setEditTitle}
          />
          <View className="mb-4">
            <Text className="text-sm font-medium text-secondary-800 mb-1.5">
              Description
            </Text>
            <View className="border border-border rounded-lg bg-background px-3">
              <TextInput
                className="py-3 text-sm text-secondary-800"
                placeholder="Project description"
                placeholderTextColor={COLORS.muted}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
            </View>
          </View>
          {project && (
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-muted mr-2">Status:</Text>
              <Badge
                label={project.status}
                color={
                  project.status === 'ACTIVE'
                    ? COLORS.success
                    : project.status === 'COMPLETED'
                      ? COLORS.info
                      : COLORS.muted
                }
                variant="filled"
                size="sm"
              />
            </View>
          )}
          <Button
            title="Save Changes"
            onPress={handleSaveGeneral}
            loading={isSavingGeneral}
            fullWidth
          />
        </View>
      </CollapsibleSection>

      {/* Columns */}
      <CollapsibleSection title="Columns">
        <View className="pt-3">
          {columns.map((col, idx) => (
            <View
              key={col.id}
              className="flex-row items-center py-2.5 border-b border-gray-100"
            >
              {/* Reorder buttons */}
              <View className="mr-2">
                <TouchableOpacity
                  onPress={() => handleReorderColumn(col.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5"
                >
                  <ChevronUp
                    size={16}
                    color={idx === 0 ? COLORS.border : COLORS.muted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReorderColumn(col.id, 'down')}
                  disabled={idx === columns.length - 1}
                  className="p-0.5"
                >
                  <ChevronDown
                    size={16}
                    color={
                      idx === columns.length - 1 ? COLORS.border : COLORS.muted
                    }
                  />
                </TouchableOpacity>
              </View>

              {editingColumnId === col.id ? (
                <View className="flex-1 flex-row items-center">
                  <TextInput
                    className="flex-1 border border-primary rounded-lg px-2 py-1.5 text-sm text-secondary-800 bg-white"
                    value={editingColumnTitle}
                    onChangeText={setEditingColumnTitle}
                    autoFocus
                    onSubmitEditing={() => handleUpdateColumn(col.id)}
                  />
                  <TouchableOpacity
                    onPress={() => handleUpdateColumn(col.id)}
                    className="ml-2 p-1"
                  >
                    <Check size={18} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingColumnId(null)}
                    className="ml-1 p-1"
                  >
                    <X size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text className="flex-1 text-sm text-secondary-800">
                    {col.title}
                  </Text>
                  {col.wipLimit != null && col.wipLimit > 0 && (
                    <Text className="text-xs text-muted mr-2">
                      WIP: {col.wipLimit}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setEditingColumnId(col.id);
                      setEditingColumnTitle(col.title);
                    }}
                    className="p-1"
                  >
                    <Pencil size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteColumn(col.id, col.title)}
                    className="p-1 ml-1"
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}

          {/* Add Column */}
          <View className="flex-row items-center mt-3">
            <TextInput
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-secondary-800 bg-white"
              placeholder="New column title..."
              placeholderTextColor={COLORS.muted}
              value={newColumnTitle}
              onChangeText={setNewColumnTitle}
              onSubmitEditing={handleAddColumn}
            />
            <TouchableOpacity
              onPress={handleAddColumn}
              className="ml-2 p-2 rounded-lg"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CollapsibleSection>

      {/* Labels */}
      <CollapsibleSection title="Labels">
        <View className="pt-3">
          {labels.map((label) => (
            <View
              key={label.id}
              className="flex-row items-center py-2.5 border-b border-gray-100"
            >
              {editingLabelId === label.id ? (
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <TextInput
                      className="flex-1 border border-primary rounded-lg px-2 py-1.5 text-sm text-secondary-800 bg-white"
                      value={editingLabelName}
                      onChangeText={setEditingLabelName}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => handleUpdateLabel(label.id)}
                      className="ml-2 p-1"
                    >
                      <Check size={18} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditingLabelId(null)}
                      className="ml-1 p-1"
                    >
                      <X size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row flex-wrap mt-2">
                    {LABEL_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setEditingLabelColor(c)}
                        className={`w-7 h-7 rounded-full mr-2 mb-1 items-center justify-center ${
                          editingLabelColor === c ? 'border-2 border-secondary-800' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {editingLabelColor === c && (
                          <Check size={14} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: label.color }}
                  />
                  <Text className="flex-1 text-sm text-secondary-800">
                    {label.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingLabelId(label.id);
                      setEditingLabelName(label.name);
                      setEditingLabelColor(label.color);
                    }}
                    className="p-1"
                  >
                    <Pencil size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteLabel(label.id, label.name)}
                    className="p-1 ml-1"
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}

          {/* Add Label */}
          {showAddLabel ? (
            <View className="mt-3">
              <TextInput
                className="border border-border rounded-lg px-3 py-2 text-sm text-secondary-800 bg-white mb-2"
                placeholder="Label name..."
                placeholderTextColor={COLORS.muted}
                value={newLabelName}
                onChangeText={setNewLabelName}
                autoFocus
              />
              <View className="flex-row flex-wrap mb-2">
                {LABEL_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewLabelColor(c)}
                    className={`w-7 h-7 rounded-full mr-2 mb-1 items-center justify-center ${
                      newLabelColor === c ? 'border-2 border-secondary-800' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newLabelColor === c && (
                      <Check size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row">
                <Button
                  title="Add"
                  onPress={handleAddLabel}
                  size="sm"
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowAddLabel(false);
                    setNewLabelName('');
                  }}
                  className="ml-2 px-3 py-2"
                >
                  <Text className="text-sm text-muted">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddLabel(true)}
              className="flex-row items-center mt-3 py-2"
            >
              <Plus size={16} color={COLORS.primary} />
              <Text
                className="text-sm font-medium ml-1"
                style={{ color: COLORS.primary }}
              >
                Add Label
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </CollapsibleSection>

      {/* Members */}
      <CollapsibleSection title="Members">
        <View className="pt-3">
          {/* Invite */}
          <View className="flex-row items-center mb-4">
            <TextInput
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-secondary-800 bg-white"
              placeholder="Email to invite..."
              placeholderTextColor={COLORS.muted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={handleInvite}
            />
            <TouchableOpacity
              onPress={handleInvite}
              disabled={isInviting}
              className="ml-2 p-2 rounded-lg"
              style={{
                backgroundColor: isInviting
                  ? COLORS.border
                  : COLORS.primary,
              }}
            >
              <UserPlus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Member list */}
          {members.map((member) => (
            <View
              key={member.id}
              className="flex-row items-center py-2.5 border-b border-gray-100"
            >
              <Avatar
                name={member.user?.fullName}
                imageUrl={member.user?.avatarUrl}
                size="sm"
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-secondary-800">
                  {member.user?.fullName || member.user?.email}
                </Text>
                <Text className="text-xs text-muted">
                  {member.user?.email}
                </Text>
              </View>
              <Badge
                label={member.projectRole}
                color={
                  member.projectRole === 'OWNER'
                    ? COLORS.primary
                    : COLORS.muted
                }
                variant="outline"
                size="sm"
              />
              {member.projectRole !== 'OWNER' && (
                <TouchableOpacity
                  onPress={() =>
                    handleRemoveMember(
                      member.userId,
                      member.user?.fullName || 'this member',
                    )
                  }
                  className="ml-2 p-1"
                >
                  <UserMinus size={16} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </CollapsibleSection>

      {/* Danger Zone */}
      <CollapsibleSection title="Danger Zone">
        <View className="pt-3">
          <View className="border border-danger/20 rounded-xl p-4 bg-danger/5">
            <TouchableOpacity
              onPress={handleArchive}
              className="flex-row items-center py-3 border-b border-danger/10"
            >
              <Archive size={18} color={COLORS.warning} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-secondary-800">
                  Archive Project
                </Text>
                <Text className="text-xs text-muted">
                  Hide from active projects. Can be restored later.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center py-3 mt-1"
            >
              <AlertTriangle size={18} color={COLORS.danger} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-danger">
                  Delete Project
                </Text>
                <Text className="text-xs text-muted">
                  Permanently delete this project and all its data.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CollapsibleSection>
    </ScrollView>
  );
}
