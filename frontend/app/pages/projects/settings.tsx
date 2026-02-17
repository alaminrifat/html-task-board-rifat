import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Calendar,
  GripVertical,
  Trash2,
  PlusCircle,
  AlertTriangle,
  X,
  Pencil,
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import MobileHeader from '~/components/layout/mobile-header';
import DataState from '~/components/ui/empty-state';
import { projectService } from '~/services/httpServices/projectService';
import { columnService } from '~/services/httpServices/columnService';
import { memberService } from '~/services/httpServices/memberService';
import { labelService } from '~/services/httpServices/labelService';
import { cn } from '~/lib/utils';

import type { Project } from '~/types/project';
import type { Column } from '~/types/column';
import type { Label } from '~/types/label';
import type { ProjectMember, Invitation } from '~/types/member';

const AVATAR_COLORS = [
  { bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]' },
  { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'bg-white border border-[#E5E7EB]', text: 'text-[#94A3B8]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]' },
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' },
] as const;

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(str: string): string {
  const parts = str.replace(/-/g, ' ').split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
}

interface SettingsData {
  project: Project;
  columns: Column[];
  labels: Label[];
  members: ProjectMember[];
  invitations: Invitation[];
}

const LABEL_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function SortableColumnRow({
  col,
  onTitleChange,
  onWipChange,
  onBlur,
  onDelete,
}: {
  col: Column;
  onTitleChange: (id: string, title: string) => void;
  onWipChange: (id: string, wip: number) => void;
  onBlur: (col: Column) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <div
        {...attributes}
        {...listeners}
        className="text-[#94A3B8] cursor-grab hover:text-[#64748B] p-1 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <input
        type="text"
        value={col.title}
        onChange={(e) => onTitleChange(col.id, e.target.value)}
        onBlur={() => onBlur(col)}
        className="h-8 px-2.5 flex-grow rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] transition-all text-xs"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[#64748B] whitespace-nowrap">WIP</label>
        <input
          type="number"
          value={col.wipLimit ?? 0}
          onChange={(e) => onWipChange(col.id, parseInt(e.target.value, 10) || 0)}
          onBlur={() => onBlur(col)}
          className="h-8 w-[52px] px-1.5 text-center rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] transition-all text-xs"
        />
      </div>
      <button
        type="button"
        onClick={() => onDelete(col.id)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
        aria-label={`Delete column ${col.title}`}
      >
        <Trash2 className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Label state
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [projectData, columnsData, labelsData, membersData, invitationsData] = await Promise.all([
        projectService.getById(projectId),
        columnService.list(projectId),
        labelService.list(projectId).catch(() => []),
        memberService.list(projectId),
        memberService.listInvitations(projectId),
      ]);

      const sortedColumns = (columnsData ?? []).sort((a, b) => a.position - b.position);
      const pendingInvitations = (invitationsData ?? []).filter((i) => i.status === 'PENDING');

      setData({
        project: projectData,
        columns: sortedColumns,
        labels: labelsData ?? [],
        members: membersData ?? [],
        invitations: pendingInvitations,
      });

      // Initialize form values
      setTitle(projectData?.title ?? '');
      setDescription(projectData?.description ?? '');
      setDeadline(projectData?.deadline ?? '');
      setColumns(sortedColumns);
      setLabels(labelsData ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Project info handlers
  const handleSaveProjectInfo = useCallback(async () => {
    if (!projectId || isSaving) return;

    try {
      setIsSaving(true);
      await projectService.update(projectId, {
        title: title || undefined,
        description: description || undefined,
        deadline: deadline || undefined,
      });
    } catch {
      // Save failed
    } finally {
      setIsSaving(false);
    }
  }, [projectId, title, description, deadline, isSaving]);

  // Column handlers
  const handleColumnTitleChange = useCallback((columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col))
    );
  }, []);

  const handleColumnWipChange = useCallback((columnId: string, wipLimit: number) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, wipLimit } : col))
    );
  }, []);

  const handleUpdateColumn = useCallback(
    async (column: Column) => {
      if (!projectId) return;

      try {
        await columnService.update(projectId, column.id, {
          title: column.title,
          wipLimit: column.wipLimit ?? undefined,
        });
      } catch {
        // Update failed
      }
    },
    [projectId]
  );

  const handleDeleteColumn = useCallback(
    async (columnId: string) => {
      if (!projectId) return;

      try {
        await columnService.delete(projectId, columnId);
        setColumns((prev) => prev.filter((col) => col.id !== columnId));
      } catch {
        // Delete failed
      }
    },
    [projectId]
  );

  const handleAddColumn = useCallback(async () => {
    if (!projectId) return;

    try {
      const newColumn = await columnService.create(projectId, {
        title: 'New Column',
      });
      setColumns((prev) => [...prev, newColumn]);
    } catch {
      // Create failed
    }
  }, [projectId]);

  // DnD sensors for column reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleColumnDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !projectId) return;

      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columns, oldIndex, newIndex);
      setColumns(reordered);

      try {
        await columnService.reorder(projectId, {
          columnIds: reordered.map((c) => c.id),
        });
      } catch {
        // Revert on failure
        setColumns(columns);
      }
    },
    [columns, projectId]
  );

  // Label handlers
  const handleCreateLabel = useCallback(async () => {
    if (!projectId || !newLabelName.trim()) return;

    try {
      const label = await labelService.create(projectId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setLabels((prev) => [...prev, label]);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[(labels.length + 1) % LABEL_COLORS.length]);
    } catch {
      // Create failed
    }
  }, [projectId, newLabelName, newLabelColor, labels.length]);

  const handleUpdateLabel = useCallback(
    async (labelId: string) => {
      if (!projectId || !editLabelName.trim()) return;

      try {
        const updated = await labelService.update(projectId, labelId, {
          name: editLabelName.trim(),
          color: editLabelColor,
        });
        setLabels((prev) =>
          prev.map((l) => (l.id === labelId ? updated : l))
        );
        setEditingLabelId(null);
      } catch {
        // Update failed
      }
    },
    [projectId, editLabelName, editLabelColor]
  );

  const handleDeleteLabel = useCallback(
    async (labelId: string) => {
      if (!projectId) return;

      try {
        await labelService.delete(projectId, labelId);
        setLabels((prev) => prev.filter((l) => l.id !== labelId));
      } catch {
        // Delete failed
      }
    },
    [projectId]
  );

  const startEditLabel = useCallback((label: Label) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  }, []);

  // Invite member handler
  const handleInviteMember = useCallback(async () => {
    if (!projectId || !inviteEmail.trim() || !inviteEmail.includes('@')) return;
    try {
      setIsInviting(true);
      const invitation = await memberService.invite(projectId, { email: inviteEmail.trim() });
      if (invitation) {
        setData((prev) =>
          prev ? { ...prev, invitations: [...prev.invitations, invitation] } : prev
        );
      }
      setInviteEmail('');
    } catch {
      // Silently fail
    } finally {
      setIsInviting(false);
    }
  }, [projectId, inviteEmail]);

  // Cancel invitation handler
  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!projectId) return;
      try {
        await memberService.cancelInvitation(projectId, invitationId);
        setData((prev) =>
          prev ? { ...prev, invitations: prev.invitations.filter((i) => i.id !== invitationId) } : prev
        );
      } catch {
        // Silently fail
      }
    },
    [projectId]
  );

  // Member handlers
  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!projectId) return;

      try {
        await memberService.remove(projectId, userId);
        setData((prev) =>
          prev
            ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) }
            : prev
        );
      } catch {
        // Remove failed
      }
    },
    [projectId]
  );

  const handleResendInvitation = useCallback(
    async (invitationId: string) => {
      if (!projectId) return;

      try {
        await memberService.resendInvitation(projectId, invitationId);
      } catch {
        // Resend failed
      }
    },
    [projectId]
  );

  // Danger zone handlers
  const handleArchive = useCallback(async () => {
    if (!projectId || isArchiving) return;

    try {
      setIsArchiving(true);
      await projectService.archive(projectId);
      navigate('/projects');
    } catch {
      setIsArchiving(false);
    }
  }, [projectId, isArchiving, navigate]);

  const handleDelete = useCallback(async () => {
    if (!projectId || isDeleting) return;

    try {
      setIsDeleting(true);
      await projectService.delete(projectId);
      navigate('/projects');
    } catch {
      setIsDeleting(false);
    }
  }, [projectId, isDeleting, navigate]);

  const memberCount = (data?.members ?? []).length + (data?.invitations ?? []).length;

  return (
    <div className="flex flex-col h-full">
      <MobileHeader
        title="Board Settings"
        onBack={() => navigate(`/projects/${projectId}/board`)}
      />

      <DataState<SettingsData>
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={fetchData}
        isEmpty={() => false}
      >
        {(settingsData) => (
          <main className="flex-1 overflow-y-auto hide-scrollbar p-3 pb-6 flex flex-col gap-3">
            {/* Section 1: Project Info */}
            <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
              <h4 className="text-sm font-semibold tracking-tight text-[#1E293B] mb-3">
                Project Info
              </h4>

              <div className="flex flex-col gap-4">
                {/* Board Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#1E293B]">Board Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveProjectInfo}
                    className="h-9 px-3 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#1E293B]">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSaveProjectInfo}
                    className="p-2.5 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm resize-none"
                  />
                </div>

                {/* Deadline */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#1E293B]">Deadline</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      onBlur={handleSaveProjectInfo}
                      className="h-9 px-3 pl-9 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Columns */}
            <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
              <h4 className="text-sm font-semibold tracking-tight text-[#1E293B] mb-3">
                Columns
              </h4>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleColumnDragEnd}
              >
                <SortableContext items={columns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2 mb-4">
                    {columns.map((col) => (
                      <SortableColumnRow
                        key={col.id}
                        col={col}
                        onTitleChange={handleColumnTitleChange}
                        onWipChange={handleColumnWipChange}
                        onBlur={handleUpdateColumn}
                        onDelete={handleDeleteColumn}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Column */}
              <button
                type="button"
                onClick={handleAddColumn}
                className="w-full h-8 flex items-center justify-center gap-1.5 rounded-md border border-[#E5E7EB] text-[#4A90D9] font-medium hover:bg-[#F9FAFB] hover:border-[#4A90D9]/50 transition-colors text-xs"
              >
                <PlusCircle className="h-[18px] w-[18px]" />
                Add Column
              </button>
            </section>

            {/* Section 3: Labels */}
            <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Labels</h4>
                <span className="bg-[#F1F5F9] text-[#64748B] text-xs font-medium px-2 py-0.5 rounded-full">
                  {labels.length}
                </span>
              </div>

              {/* Existing labels */}
              <div className="flex flex-col gap-2 mb-3">
                {labels.map((label) => (
                  <div key={label.id} className="flex items-center gap-2 group">
                    {editingLabelId === label.id ? (
                      <>
                        <div className="flex gap-1 shrink-0">
                          {LABEL_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditLabelColor(c)}
                              className={cn(
                                'w-5 h-5 rounded-full border-2 transition-all',
                                editLabelColor === c ? 'border-[#1E293B] scale-110' : 'border-transparent'
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editLabelName}
                          onChange={(e) => setEditLabelName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateLabel(label.id);
                            if (e.key === 'Escape') setEditingLabelId(null);
                          }}
                          autoFocus
                          className="h-7 px-2 flex-grow rounded-md border border-[#4A90D9] bg-white text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#4A90D9] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateLabel(label.id)}
                          className="text-xs font-medium text-[#4A90D9] hover:text-[#3B82F6] px-1"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLabelId(null)}
                          className="w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#64748B]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-5 h-5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-grow text-xs text-[#1E293B] font-medium truncate">
                          {label.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditLabel(label)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#4A90D9] hover:bg-[#F1F5F9] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLabel(label.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new label */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 shrink-0">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLabelColor(c)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all',
                        newLabelColor === c ? 'border-[#1E293B] scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateLabel();
                  }}
                  placeholder="New label name..."
                  className="h-7 px-2 flex-grow rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] transition-all text-xs"
                />
                <button
                  type="button"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                  className="h-7 px-3 bg-[#4A90D9] text-white text-xs font-medium rounded-md hover:bg-[#3B82F6] disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </section>

            {/* Section 4: Members */}
            <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Members</h4>
                <span className="bg-[#F1F5F9] text-[#64748B] text-xs font-medium px-2 py-0.5 rounded-full">
                  {memberCount}
                </span>
              </div>

              {/* Invite input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleInviteMember(); }
                  }}
                  placeholder="Invite by email..."
                  disabled={isInviting}
                  className="flex-1 h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] transition-all text-xs disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || isInviting}
                  className="h-8 px-3 bg-[#4A90D9] text-white text-xs font-medium rounded-md hover:bg-[#3B82F6] disabled:opacity-50 transition-colors"
                >
                  {isInviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Active Members */}
                {(settingsData.members ?? []).map((member, index) => {
                  const colorScheme = getAvatarColor(index);
                  const initials = getInitials(member.userId);

                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tracking-tight',
                              colorScheme.bg,
                              colorScheme.text
                            )}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#1E293B] leading-none mb-1">
                              {member.userId}
                            </span>
                            <span className="text-xs text-[#64748B] leading-none">
                              {member.projectRole}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-[#F1F5F9] text-[#64748B] text-xs px-2 py-1 rounded font-medium">
                            {member.projectRole === 'OWNER' ? 'Owner' : 'Member'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-xs font-medium text-[#EF4444] hover:text-[#B91C1C] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="h-px bg-[#F1F5F9] w-full" />
                    </div>
                  );
                })}

                {/* Pending Invitations */}
                {(settingsData.invitations ?? []).map((invitation, index) => {
                  const colorIndex = (settingsData.members ?? []).length + index;
                  const initials = getInitials(invitation.email);

                  return (
                    <div key={invitation.id}>
                      <div className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-dashed border-[#94A3B8] text-[#94A3B8] flex items-center justify-center text-xs font-bold tracking-tight bg-white">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#1E293B] leading-none mb-1">
                              {invitation.email}
                            </span>
                            <span className="text-xs text-[#64748B] leading-none">
                              Invited
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-[#F1F5F9] text-[#64748B] text-xs px-2 py-1 rounded font-medium">
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-xs font-medium text-[#4A90D9] hover:text-[#3B82F6] transition-colors"
                          >
                            Resend Invite
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-xs font-medium text-[#EF4444] hover:text-[#B91C1C] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {colorIndex < memberCount - 1 ? (
                        <div className="h-px bg-[#F1F5F9] w-full" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-white rounded-lg p-4 border border-[#EF4444]/30 shadow-sm relative overflow-visible">
              {/* Red accent top line */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-[#EF4444]/20" />

              <h4 className="text-sm font-semibold tracking-tight text-[#EF4444] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-[18px] w-[18px]" />
                Danger Zone
              </h4>

              <div className="flex flex-col gap-2">
                {/* Archive Button */}
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="w-full h-12 flex items-center justify-center rounded-lg border border-[#F59E0B] text-[#D97706] font-medium hover:bg-[#FFFBEB] transition-colors text-sm disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Archive Project'}
                </button>

                {/* Delete Button */}
                {showDeleteConfirm ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 h-12 flex items-center justify-center rounded-lg bg-[#EF4444] text-white font-medium hover:bg-[#DC2626] transition-colors shadow-sm text-sm disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 h-12 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F9FAFB] transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full h-12 flex items-center justify-center rounded-lg bg-[#EF4444] text-white font-medium hover:bg-[#DC2626] transition-colors shadow-sm text-sm"
                  >
                    Delete Project
                  </button>
                )}
              </div>

              <p className="text-[10px] text-[#64748B] mt-3 text-center">
                Once you delete a project, there is no going back. Please be certain.
              </p>
            </section>
          </main>
        )}
      </DataState>
    </div>
  );
}
