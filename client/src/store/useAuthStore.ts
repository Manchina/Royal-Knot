import { create } from 'zustand';
import { api } from '../api/client';

export type UserRole = 'FOUNDER' | 'SUPER_ADMIN' | 'LEAD_PLANNER' | 'COORDINATOR' | 'FINANCE_MANAGER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  title: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  
  login: (email: string, password?: string) => Promise<boolean>;
  quickLogin: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
  clearError: () => void;
}

const ROLE_EMAILS: Record<UserRole, string> = {
  FOUNDER: 'founder@royalknot.com',
  SUPER_ADMIN: 'admin@royalknot.com',
  LEAD_PLANNER: 'planner@royalknot.com',
  COORDINATOR: 'coordinator@royalknot.com',
  FINANCE_MANAGER: 'finance@royalknot.com',
  CLIENT: 'client@royalknot.com',
};

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('rk_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem('rk_jwt_token');
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken && !!initialUser,
  isInitialized: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password = 'password123') => {
    set({ loading: true, error: null });
    try {
      const data = await api.post<{ success: boolean; token: string; user: User }>('/api/auth/login', {
        email,
        password,
      });

      if (!data.success || !data.token) {
        throw new Error('Authentication failed');
      }

      localStorage.setItem('rk_jwt_token', data.token);
      localStorage.setItem('rk_user', JSON.stringify(data.user));

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Unable to connect to server' });
      return false;
    }
  },

  quickLogin: async (role: UserRole) => {
    const email = ROLE_EMAILS[role];
    return get().login(email, 'password123');
  },

  logout: () => {
    localStorage.removeItem('rk_jwt_token');
    localStorage.removeItem('rk_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      error: null,
    });
  },

  initAuth: async () => {
    const token = localStorage.getItem('rk_jwt_token');
    const storedUser = getStoredUser();

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
      });
      return;
    }

    try {
      const data = await api.get<{ success: boolean; user: User }>('/api/auth/me');
      if (data.success && data.user) {
        localStorage.setItem('rk_user', JSON.stringify(data.user));
        set({
          user: data.user,
          token,
          isAuthenticated: true,
          isInitialized: true,
          loading: false,
        });
        return;
      }
    } catch (e) {
      console.warn('Token verify failed or server offline, keeping cached user session:', e);
      if (storedUser) {
        set({
          user: storedUser,
          token,
          isAuthenticated: true,
          isInitialized: true,
          loading: false,
        });
        return;
      }
    }

    // If token was invalid and no stored user
    set({
      user: storedUser,
      token,
      isAuthenticated: !!storedUser,
      isInitialized: true,
      loading: false,
    });
  },
}));
