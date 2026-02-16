import { Outlet, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Sidebar } from '~/components/layout/sidebar';
import { useAuth } from '~/hooks/useAuth';
import { cn } from '~/lib/utils';

// DEV_BYPASS: Set to true to skip auth and preview pages without a backend
const DEV_BYPASS_AUTH = import.meta.env.DEV;

export default function AdminLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore collapse state from localStorage (SSR-safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', String(next));
      }
      return next;
    });
  };

  // Redirect to login if not authenticated (skipped in dev mode)
  useEffect(() => {
    if (!DEV_BYPASS_AUTH && !isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (!DEV_BYPASS_AUTH && isLoading) {
    return (
      <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center text-white select-none relative"
        style={{ background: 'linear-gradient(180deg, #4A90D9 0%, #3A7BC8 100%)' }}
      >
        <main className="flex flex-col items-center z-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">
            TaskBoard
          </h1>
          <div className="mt-6 text-white/90">
            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </main>
        <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay opacity-20" />
      </div>
    );
  }

  if (!DEV_BYPASS_AUTH && !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1E293B] overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />

      <main
        className={cn(
          'flex-1 h-screen overflow-y-auto p-8 transition-[margin-left] duration-300 ease-in-out',
          isCollapsed ? 'ml-[64px]' : 'ml-[240px]'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
