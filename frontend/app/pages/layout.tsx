import { Outlet } from 'react-router';

import ProtectedRoute from '~/components/auth/protected-route';
import MobileContainer from '~/components/layout/mobile-container';
import BottomNav from '~/components/layout/bottom-nav';

export default function BaseLayout() {
  return (
    <ProtectedRoute>
      <MobileContainer>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <Outlet />
        </div>
        <BottomNav />
      </MobileContainer>
    </ProtectedRoute>
  );
}
