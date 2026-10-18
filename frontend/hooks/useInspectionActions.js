import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Extract a user-friendly error message and optional field errors
 * from an Axios/API error response.
 *
 * @param {Error} error - The caught error object.
 * @returns {{ message: string, errors: object|null }}
 */
export function extractError(error) {
  const resp = error?.response?.data;
  if (resp && typeof resp === 'object') {
    const message = resp.message || error.message || 'An unexpected error occurred.';
    const errors = resp.errors || null;
    return { message, errors };
  }
  return { message: error?.message || 'An unexpected error occurred.', errors: null };
}

export function useSaveInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const { id, ...payload } = variables;
      if (id) {
        const res = await api.put(`/inspections/${id}`, payload);
        return res.data;
      }
      const res = await api.post('/inspections', payload);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      const id = variables.id || _data?.item?._id || _data?.data?.id;
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      }
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useSubmitInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const id = typeof variables === 'string' ? variables : variables.id;
      const res = await api.post(`/inspections/${id}/submit`);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      const id = typeof variables === 'string' ? variables : variables.id;
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useReturnInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const { id, ...payload } = variables;
      const res = await api.post(`/inspections/${id}/return`, payload);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useDirectorApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const res = await api.post(`/inspections/${variables.id}/director-approve`);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useFinalApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const res = await api.post(`/inspections/${variables.id}/final-approve`);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useRevertInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const { id, ...payload } = variables;
      const res = await api.post(`/inspections/${id}/revert`, payload);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const res = await api.delete(`/inspections/${variables.id}`);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const payload = variables.payload || variables;
      const res = await api.post(`/inspections/${variables.id}/comments`, payload);
      return res.data;
    },
    onError: (error) => extractError(error),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection-comments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
    },
  });
}