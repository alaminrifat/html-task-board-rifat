import { Navigate, Outlet } from 'react-router';
import { Loader2 } from 'lucide-react';

import { useAuth } from '~/hooks/useAuth';

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="relative">
      <Outlet />
    </div>
  );
}
