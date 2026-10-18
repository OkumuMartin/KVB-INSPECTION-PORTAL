'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.user ?? null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await api.post('/auth/login', { username, password });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onError: (error) => {
      // Logout only clears an httpOnly cookie — even if the request fails
      // (e.g. CSRF/403), the session is effectively over on the client.
      // Surface the error without blocking the local sign-out.
      console.error('Logout request failed:', error);
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onSettled: () => {
      // Always clear local auth state, regardless of success or failure.
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = async (username, password) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Local sign-out must still complete even if the server request fails.
      console.error('Logout request failed:', error);
    }
  };

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  useEffect(() => {
    const handleAuthLogout = () => {
      queryClient.setQueryData(['auth', 'me'], null);
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [queryClient]);

  const value = {
    user: user ?? null,
    loading: userLoading || !clientLoaded,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
