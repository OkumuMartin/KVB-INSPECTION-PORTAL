import { useEffect, useState, useCallback } from 'react';
import apiRequest from './api';

const statusLabels = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Director Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

export function StatusBadge({ status, showIcon = false }) {
  const label = statusLabels[status] || status;
  return (
    <span className={`status-badge ${status}`}>
      {showIcon && <span style={{ marginRight: 4 }}>●</span>}
      {label}
    </span>
  );
}

export function useInspections(filters = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 25 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInspections = useCallback(async (params = {}) => {
    const queryParams = new URLSearchParams();
    const f = { ...filters, ...params };
    Object.entries(f).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    try {
      setLoading(true);
      setError('');
      const result = await apiRequest(`/inspections?${queryParams.toString()}`);
      setData(result);
    } catch (err) {
      setError(err.message || 'Unable to load inspections.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  return { data, loading, error, refetch: fetchInspections };
}

export const STATUS_LABELS = statusLabels;
