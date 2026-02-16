import { Provider } from 'react-redux';

import { store } from '~/redux/store/store';
import { AuthProvider } from '~/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}
