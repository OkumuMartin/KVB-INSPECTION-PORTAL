'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  FALLBACK_FINDING_SECTIONS,
  FALLBACK_FINDING_STATUSES,
  OUTLET_TYPE_OPTIONS,
  FALLBACK_TRAINING_LEVELS,
  LIMITS,
  MAX_ATTENDANTS,
} from '../lib/inspectionForm';

export function useInspectionFormSchema() {
  // The schema and region lookups sit behind authentication, so the queries
  // wait for the session to resolve instead of collecting a 401.
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['inspection-form-schema'],
    queryFn: async () => {
      const res = await api.get('/inspection-form/schema');
      return res.data.data;
    },
    enabled: !authLoading && Boolean(user),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    findingSections: data?.findingSections || FALLBACK_FINDING_SECTIONS,
    findingStatuses: data?.findingStatuses || FALLBACK_FINDING_STATUSES,
    outletTypes: data?.outletTypes || OUTLET_TYPE_OPTIONS,
    trainingLevels: data?.trainingLevels || FALLBACK_TRAINING_LEVELS,
    productGroups: data?.productGroups,
    submissionRequirements: data?.submissionRequirements,
    maxAttendants: data?.maxAttendants || MAX_ATTENDANTS,
    limits: data?.limits || LIMITS,
    loading: isLoading || authLoading,
    error: error?.message || '',
  };
}

export function useRegions() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['regions', 'counties'],
    queryFn: async () => {
      const res = await api.get('/regions/counties');
      return res.data.data;
    },
    enabled: !authLoading && Boolean(user),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return { regions: data || [], loading: isLoading || authLoading, error: error?.message || '' };
}

export function useSubCounties(county) {
  const { user, loading: authLoading } = useAuth();
  const { data } = useQuery({
    queryKey: ['regions', 'sub-counties', county],
    queryFn: async () => {
      const res = await api.get(`/regions/counties/${encodeURIComponent(county)}/sub-counties`);
      return res.data.data;
    },
    enabled: !authLoading && Boolean(user) && Boolean(county),
    staleTime: 60 * 60 * 1000,
  });

  return data || [];
}
