'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
  FALLBACK_FINDING_SECTIONS,
  FALLBACK_FINDING_STATUSES,
  OUTLET_TYPE_OPTIONS,
  LIMITS,
  MAX_ATTENDANTS,
} from '../lib/inspectionForm';

export function useInspectionFormSchema() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inspection-form-schema'],
    queryFn: async () => {
      const res = await api.get('/inspection-form/schema');
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    findingSections: data?.findingSections || FALLBACK_FINDING_SECTIONS,
    findingStatuses: data?.findingStatuses || FALLBACK_FINDING_STATUSES,
    outletTypes: data?.outletTypes || OUTLET_TYPE_OPTIONS,
    productGroups: data?.productGroups,
    submissionRequirements: data?.submissionRequirements,
    maxAttendants: data?.maxAttendants || MAX_ATTENDANTS,
    limits: data?.limits || LIMITS,
    loading: isLoading,
    error: error?.message || '',
  };
}

export function useRegions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['regions', 'counties'],
    queryFn: async () => {
      const res = await api.get('/regions/counties');
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return { regions: data || [], loading: isLoading, error: error?.message || '' };
}

export function useSubCounties(county) {
  const { data } = useQuery({
    queryKey: ['regions', 'sub-counties', county],
    queryFn: async () => {
      const res = await api.get(`/regions/counties/${encodeURIComponent(county)}/sub-counties`);
      return res.data.data;
    },
    enabled: Boolean(county),
    staleTime: 60 * 60 * 1000,
  });

  return data || [];
}
