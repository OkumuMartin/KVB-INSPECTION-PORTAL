import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Pagination from '../components/Pagination';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [retrying, setRetrying] = useState(null);

  const limit = 50;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/email-logs?page=${page}&limit=${limit}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load email logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleRetry = async (id) => {
    if (!window.confirm('Retry sending this email?')) return;

    try {
      setRetrying(id);
      await apiRequest(`/email-logs/${id}/retry`, { method: 'POST' });
      loadLogs();
    } catch (err) {
      setError(err.message || 'Unable to retry email.');
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Email Logs</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <div className="loader">Loading email logs...</div>
        ) : logs.length === 0 ? (
          <p className="empty-state">No email logs found.</p>
        ) : (
          <>
            <div className="list-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</td>
                      <td>{log.recipient}</td>
                      <td>{log.emailType}</td>
                      <td>{log.status}</td>
                      <td>{log.attempts || 0}</td>
                      <td>
                        {log.status === 'FAILED' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: 12, padding: '4px 8px' }}
                            onClick={() => handleRetry(log._id)}
                            disabled={retrying === log._id}
                          >
                            {retrying === log._id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
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
