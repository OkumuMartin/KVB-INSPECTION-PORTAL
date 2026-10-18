'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Director Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

export function useInspections(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inspections', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const res = await api.get(`/inspections?${queryParams.toString()}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
  };

  return {
    data: data || { items: [], total: 0, page: 1, limit: 25 },
    loading,
    error: error?.message || '',
    refetch,
    invalidate,
  };
}

export function useInspection(id) {
  const {
    data: inspection,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['inspection', id],
    queryFn: async () => {
      const res = await api.get(`/inspections/${id}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  return { inspection, loading, error: error?.message || '' };
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/inspections', formData).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/inspections/${id}`, data).then((res) => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useSubmitInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.post(`/inspections/${id}/submit`, data).then((res) => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useReturnInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => api.post(`/inspections/${id}/return`, { reason }).then((res) => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useDirectorApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signature }) => api.post(`/inspections/${id}/director-approve`, { signature }).then((res) => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useFinalApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signature }) => api.post(`/inspections/${id}/final-approve`, { signature }).then((res) => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useGeneratePdf() {
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.get(`/inspections/${id}/pdf`, {
        responseType: 'blob',
      });
      return res.data;
    },
  });
}
