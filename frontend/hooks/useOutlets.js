'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useOutlets(filters = {}) {
  const queryClient = useQueryClient();
  // The outlet list requires a session, so the request waits for the auth
  // check instead of asking the API a question it can only refuse.
  const { user, loading: authLoading } = useAuth();

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['outlets', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const res = await api.get(`/outlets?${queryParams.toString()}`);
      return res.data;
    },
    enabled: !authLoading && Boolean(user),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['outlets'] });
  };

  return {
    data: data || { items: [], total: 0 },
    loading: loading || authLoading,
    error: error?.message || '',
    refetch,
    invalidate,
  };
}

export function useOutlet(id) {
  const { user, loading: authLoading } = useAuth();
  const {
    data: outlet,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['outlet', id],
    queryFn: async () => {
      const res = await api.get(`/outlets/${id}`);
      return res.data.item;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !authLoading && Boolean(user) && Boolean(id),
  });

  return { outlet, loading: loading || authLoading, error: error?.message || '' };
}

export function useCreateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/outlets', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/outlets/${id}`, data).then((res) => res.data),
    onError: (error) => {
      // Surface the server message through the component's catch block.
      const resp = error?.response?.data;
      error.message = resp?.message || error.message || 'Failed to update outlet.';
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outlet', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
  });
}

export function useDeleteOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/outlets/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
  });
}
