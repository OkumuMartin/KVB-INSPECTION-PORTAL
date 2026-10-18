import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Pagination from '../components/Pagination';

const AUDIT_ACTIONS = [
  'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
  'INSPECTION_CREATED', 'INSPECTION_UPDATED', 'DRAFT_SAVED',
  'INSPECTION_SUBMITTED', 'INSPECTION_RETURNED', 'INSPECTION_RESUBMITTED',
  'DIRECTOR_APPROVED', 'CEO_FINAL_APPROVED', 'COMMENT_ADDED',
  'SIGNATURE_CAPTURED', 'PDF_GENERATED', 'EMAIL_SENT', 'EMAIL_FAILED',
  'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED', 'PASSWORD_RESET',
  'OUTLET_CREATED', 'OUTLET_UPDATED',
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: '', user: '' });

  const limit = 50;

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams();
      query.append('page', page);
      query.append('limit', limit);
      if (filters.action) query.append('action', filters.action);
      if (filters.user) query.append('user', filters.user);

      const data = await apiRequest(`/users/audit-logs?${query.toString()}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleFilterApply = () => {
    setPage(1);
    loadLogs();
  };

  const handleClear = () => {
    setFilters({ action: '', user: '' });
    setPage(1);
    loadLogs();
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Audit Logs</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <label className="field-label">
            Action
            <select name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            User ID
            <input type="text" name="user" value={filters.user} onChange={handleFilterChange} placeholder="Filter by user ID" />
          </label>
          <div className="action-row">
            <button type="button" className="btn btn-secondary" onClick={handleFilterApply}>Apply</button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loader">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <p className="empty-state">No audit logs found.</p>
        ) : (
          <>
            <div className="list-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Inspection</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</td>
                      <td>{log.user ? `${log.user.name || ''} (${log.user.email || ''})` : 'System'}</td>
                      <td>{log.role || 'N/A'}</td>
                      <td>{log.action}</td>
                      <td>{log.inspection ? String(log.inspection).slice(-8) : 'N/A'}</td>
                      <td style={{ fontSize: 11, color: 'var(--kvb-muted)' }}>
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

