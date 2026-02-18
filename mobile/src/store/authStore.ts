import { create } from 'zustand';
import type { User } from '~/types/user';
import { tokenStorage } from '~/utils/tokenStorage';
import { authService } from '~/services/authService';
import { userService } from '~/services/userService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    jobTitle?: string;
    invitationToken?: string;
  }) => Promise<void>;
  googleLogin: (token: string, fullName: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await userService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const response = await authService.login({ email, password });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      set({ user: response.user, isAuthenticated: true });
    } catch (err: unknown) {
      const message =
        err != null && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Login failed';
      set({ error: message });
      throw err;
    }
  },

  register: async (data) => {
    set({ error: null });
    try {
      await authService.register(data);
    } catch (err: unknown) {
      const message =
        err != null && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Registration failed';
      set({ error: message });
      throw err;
    }
  },

  googleLogin: async (token: string, fullName: string, email: string) => {
    set({ error: null });
    try {
      const response = await authService.googleAuth({
        token,
        fullName,
        email,
        socialLoginType: 'GOOGLE',
        termsAndConditionsAccepted: true,
      });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      set({ user: response.user, isAuthenticated: true });
    } catch (err: unknown) {
      const message =
        err != null && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Google login failed';
      set({ error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  refreshUser: async () => {
    try {
      const user = await userService.getMe();
      set({ user });
    } catch {
      // Silently fail
    }
  },

  clearError: () => set({ error: null }),
}));
