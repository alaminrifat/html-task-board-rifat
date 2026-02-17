import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';

import ProtectedRoute from '~/components/auth/protected-route';
import MobileContainer from '~/components/layout/mobile-container';
import BottomNav from '~/components/layout/bottom-nav';
import { notificationService } from '~/services/httpServices/notificationService';

export default function BaseLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  return (
    <ProtectedRoute>
      <MobileContainer>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <Outlet />
        </div>
        <BottomNav unreadCount={unreadCount} />
      </MobileContainer>
    </ProtectedRoute>
  );
}
