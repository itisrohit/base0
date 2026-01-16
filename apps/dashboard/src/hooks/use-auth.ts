import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Types
export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface JwtPayload {
  sub?: string;
  id?: string;
  email: string;
}

// Hooks
export function useAuth() {
  const router = useRouter();

  // We use a query to represent the user's session state
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = Cookies.get('auth_token');
      if (!token) return null;

      try {
        // For now, decode JWT to be fast & optimistic
        const decoded = jwtDecode<JwtPayload>(token);
        // Basic structure check
        // Adjust based on your actual JWT payload structure
        return { id: decoded.sub || decoded.id || '', email: decoded.email };
      } catch (_e) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const isAuthenticated = !!user;

  const logout = () => {
    Cookies.remove('auth_token');
    // Invalidate queries using the queryClient instance (passed via context or prop if not available here directly)
    // For simplicity in this hook file, we might return a mutation or rely on usage in components
    router.invalidate();
    router.navigate({ to: '/login' });
  };

  return { user, isAuthenticated, isLoading, logout };
}
