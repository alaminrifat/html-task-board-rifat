import { useNavigate } from 'react-router';
import { ArrowLeft, Columns3, Calendar, Settings, BarChart3, Trash2 } from 'lucide-react';

import { cn } from '~/lib/utils';

interface MemberAvatar {
  userId: string;
  fullName?: string;
  avatarUrl?: string | null;
}

interface ProjectHeaderProps {
  projectTitle: string;
  activeTab: 'board' | 'calendar' | 'settings' | 'dashboard' | 'trash';
  projectId: string;
  progress?: number;
  members?: MemberAvatar[];
}

const AVATAR_COLORS = [
  '#4F46E5', '#16A34A', '#D97706', '#DB2777', '#0284C7', '#7C3AED',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const tabs = [
  { key: 'board', icon: Columns3, route: (id: string) => `/projects/${id}/board` },
  { key: 'calendar', icon: Calendar, route: (id: string) => `/projects/${id}/calendar` },
  { key: 'settings', icon: Settings, route: (id: string) => `/projects/${id}/settings` },
  { key: 'dashboard', icon: BarChart3, route: (id: string) => `/projects/${id}/dashboard` },
  { key: 'trash', icon: Trash2, route: (id: string) => `/projects/${id}/trash` },
] as const;

export default function ProjectHeader({
  projectTitle,
  activeTab,
  projectId,
  progress,
  members,
}: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-3 shrink-0 z-30">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0"
          aria-label="Back to projects"
        >
          <ArrowLeft className="h-[22px] w-[22px]" />
        </button>
        <h4 className="text-lg font-semibold tracking-tight text-[#1E293B] truncate">
          {projectTitle}
        </h4>
      </div>

      {/* Center: Member Avatars */}
      {members && members.length > 0 && (
        <div className="flex items-center shrink-0 mr-2">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member, i) => (
              <div
                key={member.userId}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: 5 - i }}
                title={member.fullName ?? member.userId}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.fullName ?? ''}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(member.fullName ?? member.userId)
                )}
              </div>
            ))}
            {members.length > 5 && (
              <div
                className="w-7 h-7 rounded-full border-2 border-white bg-[#F1F5F9] flex items-center justify-center text-[9px] font-semibold text-[#64748B] shrink-0"
                style={{ zIndex: 0 }}
              >
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Icons + Progress */}
      <div className="flex items-center gap-1 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isTrash = tab.key === 'trash';

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.route(projectId))}
              className={cn(
                'p-1.5 rounded transition-colors',
                isActive && 'text-[#4A90D9] hover:bg-[#F0F7FF]',
                !isActive && !isTrash && 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]',
                !isActive && isTrash && 'text-[#94A3B8] hover:text-red-500 hover:bg-red-50'
              )}
              aria-label={tab.key}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}

        {progress != null ? (
          <div className="h-5 bg-[#4A90D9] text-white text-[10px] font-semibold rounded-full px-2 flex items-center justify-center ml-1">
            {progress}%
          </div>
        ) : null}
      </div>
    </header>
  );
}
