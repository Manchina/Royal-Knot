import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

export interface AuthMeResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    title: string;
  };
}

export interface RolesResponse {
  success: boolean;
  roles: Array<{
    role: string;
    email: string;
    full_name: string;
    title: string;
  }>;
}

export function useCurrentUser() {
  const token = localStorage.getItem('rk_jwt_token');

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<AuthMeResponse>('/api/auth/me'),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAvailableRoles() {
  return useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: () => api.get<RolesResponse>('/api/auth/roles'),
    staleTime: Infinity,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password = 'password123' }: { email: string; password?: string }) => {
      const success = await login(email, password);
      if (!success) {
        throw new Error('Authentication failed');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
