import { createContext, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { setUser, clearUser, setLoading, setError } from '~/redux/features/userSlice';
import { authService } from '~/services/httpServices/authService';
import { userService } from '~/services/httpServices/userService';

import type { ReactNode } from 'react';
import type { User } from '~/types/user';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle?: string;
  avatarUrl?: string;
  invitationToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, loading: isLoading } = useAppSelector((state) => state.user);
  const navigate = useNavigate();

  // Check auth status on mount by fetching current user profile
  useEffect(() => {
    const checkAuth = async () => {
      // Dev bypass: skip API call and set mock user for visual testing
      if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
        dispatch(
          setUser({
            id: 'dev-user',
            fullName: 'Dev User',
            email: 'dev@example.com',
            role: 'USER',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as User)
        );
        dispatch(setLoading(false));
        return;
      }

      dispatch(setLoading(true));
      try {
        const currentUser = await userService.getMe();
        dispatch(setUser(currentUser));
      } catch {
        dispatch(clearUser());
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkAuth();
  }, [dispatch]);

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const response = await authService.login({ email, password });
        dispatch(setUser(response.user));
      } catch (err: unknown) {
        const message =
          err != null && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Login failed';
        dispatch(setError(message));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      dispatch(clearUser());
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await userService.getMe();
      dispatch(setUser(currentUser));
    } catch {
      // Silently fail — user stays as-is
    }
  }, [dispatch]);

  const register = useCallback(
    async (data: RegisterData) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        await authService.register(data);
      } catch (err: unknown) {
        const message =
          err != null && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Registration failed';
        dispatch(setError(message));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
