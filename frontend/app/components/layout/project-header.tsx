import { useNavigate } from 'react-router';
import { ArrowLeft, Columns3, Calendar, Settings, BarChart3, Trash2 } from 'lucide-react';

import { cn } from '~/lib/utils';

interface ProjectHeaderProps {
  projectTitle: string;
  activeTab: 'board' | 'calendar' | 'settings' | 'dashboard' | 'trash';
  projectId: string;
  progress?: number;
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
