import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { WifiOff } from 'lucide-react';

import ProtectedRoute from '~/components/auth/protected-route';
import MobileContainer from '~/components/layout/mobile-container';
import BottomNav from '~/components/layout/bottom-nav';
import { notificationService } from '~/services/httpServices/notificationService';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';

export default function BaseLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  return (
    <ProtectedRoute>
      <MobileContainer>
        {isOffline && (
          <div className="bg-[#F59E0B] text-white text-xs font-medium px-3 py-1.5 flex items-center justify-center gap-1.5 shrink-0">
            <WifiOff className="h-3.5 w-3.5" />
            <span>You are offline. Viewing cached data.</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <Outlet context={{ isOffline }} />
        </div>
        <BottomNav unreadCount={unreadCount} />
      </MobileContainer>
    </ProtectedRoute>
  );
}
