import { useState, useEffect, useCallback, useMemo } from 'react';

import { useNavigate } from 'react-router';
import {
  Search,
  LayoutGrid,
  Calendar,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import FilterChips from '~/components/ui/filter-chips';
import Fab from '~/components/ui/fab';
import DataState from '~/components/ui/empty-state';
import { projectService } from '~/services/httpServices/projectService';

import type { Project } from '~/types/project';
import type { PaginatedResponse } from '~/types/common';

const FILTER_OPTIONS = ['All', 'Active', 'Completed', 'Archived'];

function getInitials(title: string): string {
  return (title ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function formatDeadline(deadline?: string): string {
  if (!deadline) return '';
  try {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  try {
    return new Date(deadline) < new Date();
  } catch {
    return false;
  }
}

export default function ProjectList() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: PaginatedResponse<Project> = await projectService.list();
      setProjects(response?.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (filter === 'All') return projects;
    return (projects ?? []).filter(
      (p) => p?.status === filter.toUpperCase()
    );
  }, [projects, filter]);

  return (
    <div className="flex-1 flex flex-col relative min-h-full">
      {/* Header */}
      <MobileHeader
        title="Projects"
        rightContent={
          <div className="flex items-center gap-4 text-[#1E293B]">
            <button
              type="button"
              className="flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-6 w-6" />
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Filter & Sort Row */}
        <div className="flex items-center justify-between pl-4 pr-4 py-4 gap-2">
          <FilterChips
            options={FILTER_OPTIONS}
            activeFilter={filter}
            onChange={setFilter}
          />
          <div className="flex items-center gap-1 text-sm text-[#64748B] font-medium shrink-0 cursor-pointer">
            <span>Recent</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>

        {/* Projects Grid */}
        <DataState<Project[]>
          isLoading={isLoading}
          error={error}
          data={filteredProjects}
          onRetry={fetchProjects}
        >
          {(data) => (
            <div className="grid grid-cols-2 gap-[12px] px-4">
              {(data ?? []).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}/board`)}
                />
              ))}
            </div>
          )}
        </DataState>
      </main>

      {/* FAB */}
      <Fab onClick={() => navigate('/projects/new')} />
    </div>
  );
}

/* ---------- Project Card (inline) ---------- */

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const completed = project.status === 'COMPLETED';
  const overdue =
    !completed && project.status === 'ACTIVE' && isOverdue(project.deadline);
  const deadlineLabel = formatDeadline(project.deadline);
  const initials = getInitials(project.title);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white p-4 rounded-lg border border-[#E5E7EB] flex flex-col justify-between h-[180px] active:scale-[0.98] transition-transform cursor-pointer select-none"
    >
      {/* Top section */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xl font-medium text-[#1E293B] leading-tight line-clamp-2 tracking-tight">
            {project.title}
          </h4>
        </div>
        {/* Member avatars placeholder */}
        <div className="flex items-center -space-x-2 mb-4">
          <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-[10px] font-bold">
            {initials}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="space-y-3">
        {/* Progress bar (placeholder since we don't have task counts from API) */}
        <div className="w-full bg-[#E5E7EB] h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#4A90D9] h-full rounded-full"
            style={{ width: completed ? '100%' : '0%' }}
          />
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between">
          {completed ? (
            <div className="flex items-center gap-1 text-[#10B981]">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Done</span>
            </div>
          ) : overdue ? (
            <div className="flex items-center gap-1 text-[#EF4444]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Late</span>
            </div>
          ) : deadlineLabel ? (
            <div className="flex items-center gap-1 text-[#64748B]">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">{deadlineLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#64748B]">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">No deadline</span>
            </div>
          )}
          <span className="text-xs text-[#64748B]">
            {project.template?.toLowerCase() ?? 'default'}
          </span>
        </div>
      </div>
    </div>
  );
}
