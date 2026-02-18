import { useLocation, Link, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileBarChart,
  Settings,
  ChevronsLeft,
  LogOut,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { useAuth } from '~/hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'User Management', icon: Users, path: '/users' },
  { label: 'Project Management', icon: FolderOpen, path: '/projects' },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
  { label: 'System Configuration', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0 h-screen fixed left-0 top-0 z-50 transition-[width] duration-300 ease-in-out overflow-hidden',
        isCollapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'h-[64px] flex items-center transition-all duration-300',
          isCollapsed ? 'justify-center px-0' : 'px-6'
        )}
      >
        <div className={cn('flex items-center', isCollapsed ? 'gap-0' : 'gap-2')}>
          <div className="w-6 h-6 bg-[#4A90D9] rounded-md flex items-center justify-center text-white font-bold text-xs tracking-tighter flex-shrink-0">
            TB
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-[#1E293B] whitespace-nowrap">
              TaskBoard
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 mt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'h-[48px] flex items-center gap-3 border-l-[3px] transition-colors',
                active
                  ? 'bg-[#4A90D9]/10 border-[#4A90D9] text-[#4A90D9] pl-[13px]'
                  : 'border-transparent text-[#64748B] hover:bg-gray-50 pl-4',
                isCollapsed && 'justify-center pl-0 !gap-0'
              )}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-2">
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className={cn(
            'flex items-center gap-3 text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors w-full rounded-lg px-3 py-2.5',
            isCollapsed && 'justify-center px-0 gap-0'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Logout</span>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center gap-3 text-[#64748B] hover:text-[#1E293B] transition-colors w-full',
            isCollapsed && 'justify-center gap-0'
          )}
        >
          <ChevronsLeft
            className={cn(
              'w-5 h-5 flex-shrink-0 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
