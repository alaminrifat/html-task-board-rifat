import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useNavigate } from 'react-router';
import {
  Search,
  LayoutGrid,
  LayoutList,
  Calendar,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import FilterChips from '~/components/ui/filter-chips';
import Fab from '~/components/ui/fab';
import DataState from '~/components/ui/empty-state';
import { projectService } from '~/services/httpServices/projectService';

import type { Project } from '~/types/project';
import type { PaginatedResponse } from '~/types/common';

const FILTER_OPTIONS = ['All', 'Active', 'Completed', 'Archived'];

const SORT_OPTIONS = [
  { label: 'Recent', sortBy: 'createdAt', sortOrder: 'DESC' as const },
  { label: 'Deadline', sortBy: 'deadline', sortOrder: 'ASC' as const },
  { label: 'Name', sortBy: 'title', sortOrder: 'ASC' as const },
];

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

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort state
  const [sortIndex, setSortIndex] = useState(0);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sort = SORT_OPTIONS[sortIndex];
      const response: PaginatedResponse<Project> = await projectService.list({
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });
      setProjects(response?.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [sortIndex, debouncedSearch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!isSortOpen) return;
    const handleClick = () => setIsSortOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isSortOpen]);

  const filteredProjects = useMemo(() => {
    if (filter === 'All') return projects;
    return (projects ?? []).filter(
      (p) => p?.status === filter.toUpperCase()
    );
  }, [projects, filter]);

  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (prev) {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col relative min-h-full">
      {/* Header */}
      {isSearchOpen ? (
        <div className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center px-4 gap-3 shrink-0">
          <Search className="h-5 w-5 text-[#94A3B8] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 text-sm text-[#1E293B] placeholder-[#94A3B8] outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={handleToggleSearch}
            className="shrink-0 p-1"
            aria-label="Close search"
          >
            <X className="h-5 w-5 text-[#64748B]" />
          </button>
        </div>
      ) : (
        <MobileHeader
          title="Projects"
          rightContent={
            <div className="flex items-center gap-4 text-[#1E293B]">
              <button
                type="button"
                onClick={handleToggleSearch}
                className="flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Search"
              >
                <Search className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
                className="flex items-center justify-center active:scale-95 transition-transform"
                aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? (
                  <LayoutList className="h-6 w-6" />
                ) : (
                  <LayoutGrid className="h-6 w-6" />
                )}
              </button>
            </div>
          }
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Filter & Sort Row */}
        <div className="flex items-center justify-between pl-4 pr-4 py-4 gap-2">
          <FilterChips
            options={FILTER_OPTIONS}
            activeFilter={filter}
            onChange={setFilter}
          />
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSortOpen((prev) => !prev);
              }}
              className="flex items-center gap-1 text-sm text-[#64748B] font-medium cursor-pointer"
            >
              <span>{SORT_OPTIONS[sortIndex].label}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-30 min-w-[120px]">
                {SORT_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setSortIndex(idx);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      idx === sortIndex
                        ? 'text-[#4A90D9] font-medium bg-[#F0F7FF]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        <DataState<Project[]>
          isLoading={isLoading}
          error={error}
          data={filteredProjects}
          onRetry={fetchProjects}
        >
          {(data) =>
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-[12px] px-4">
                {(data ?? []).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}/board`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-4">
                {(data ?? []).map((project) => (
                  <ProjectListRow
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}/board`)}
                  />
                ))}
              </div>
            )
          }
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

/* ---------- Project List Row (inline) ---------- */

function ProjectListRow({ project, onClick }: ProjectCardProps) {
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
      className="bg-white px-4 py-3 rounded-lg border border-[#E5E7EB] flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer select-none"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#1E293B] truncate">{project.title}</h4>
        {project.description ? (
          <p className="text-xs text-[#64748B] truncate mt-0.5">{project.description}</p>
        ) : null}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 shrink-0">
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
        ) : null}
      </div>
    </div>
  );
}
