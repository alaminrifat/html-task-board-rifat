import { LayoutGrid, ListChecks, Bell, UserCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { cn } from '~/lib/utils';

interface NavTab {
  label: string;
  icon: React.ElementType;
  route: string;
  badgeCount?: number;
}

interface BottomNavProps {
  unreadCount?: number;
}

export default function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const location = useLocation();

  const tabs: NavTab[] = [
    { label: 'Projects', icon: LayoutGrid, route: '/projects' },
    { label: 'My Tasks', icon: ListChecks, route: '/my-tasks' },
    { label: 'Inbox', icon: Bell, route: '/notifications', badgeCount: unreadCount },
    { label: 'Profile', icon: UserCircle, route: '/profile' },
  ];

  const isActive = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  return (
    <nav className="h-[56px] bg-white border-t border-[#E5E7EB] flex items-center shrink-0 z-20">
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.route}
            to={tab.route}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors',
              active ? 'text-[#4A90D9] font-medium' : 'text-[#94A3B8] hover:text-[#64748B]'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {tab.badgeCount != null && tab.badgeCount > 0 ? (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#EF4444] text-white text-[10px] font-bold leading-none border border-white">
                  {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] leading-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
