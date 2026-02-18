import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from '../../redux/store/store';
import { AuthProvider } from '../useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster richColors position="top-right" />
    </Provider>
  );
}