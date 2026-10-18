import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiRequest from '../services/api';

export default function OutletDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [outlet, setOutlet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOutlet = async () => {
      try {
        const data = await apiRequest(`/outlets/${id}`);
        setOutlet(data.item);
      } catch (err) {
        setError(err.message || 'Unable to load outlet.');
      } finally {
        setLoading(false);
      }
    };

    fetchOutlet();
  }, [id]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const data = await apiRequest(`/inspections?outlet=${id}&limit=50`);
        setHistory(data.items || []);
      } catch (err) {
        // silently fail for history
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  if (loading) return <div className="loader">Loading outlet...</div>;
  if (!outlet) return <div className="panel"><h2>Outlet not found</h2></div>;

  const outletTypeLabels = {
    AGROVET: 'Agrovet',
    CHEMIST: 'Chemist',
    OTHER: 'Other',
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Outlet Details</p>
          <h1>{outlet.outletName}</h1>
        </div>
        <div className="action-row">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/outlets/${outlet._id}/edit`)}>
            Edit Outlet
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/outlets')}>
            Back to List
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <h2>Outlet Information</h2>
        <dl className="review-panel">
          <div><dt>Name</dt><dd>{outlet.outletName}</dd></div>
          <div><dt>Type</dt><dd>{outletTypeLabels[outlet.outletType] || outlet.outletType}</dd></div>
          <div><dt>Owner</dt><dd>{outlet.ownerName}</dd></div>
          <div><dt>Email</dt><dd>{outlet.ownerEmail || 'N/A'}</dd></div>
          <div><dt>Phone</dt><dd>{outlet.ownerPhone || 'N/A'}</dd></div>
          <div><dt>Address</dt><dd>{outlet.address || 'N/A'}</dd></div>
          <div><dt>County</dt><dd>{outlet.county || 'N/A'}</dd></div>
          <div><dt>Sub-County</dt><dd>{outlet.subCounty || 'N/A'}</dd></div>
          <div><dt>Centre</dt><dd>{outlet.centre || 'N/A'}</dd></div>
          <div><dt>KVB Registration</dt><dd>{outlet.kvbRegistrationInfo || 'N/A'}</dd></div>
          <div><dt>Created</dt><dd>{outlet.createdAt ? new Date(outlet.createdAt).toLocaleString() : 'N/A'}</dd></div>
          <div><dt>Last Updated</dt><dd>{outlet.updatedAt ? new Date(outlet.updatedAt).toLocaleString() : 'N/A'}</dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>Inspection History</h2>
        {historyLoading ? (
          <div className="loader">Loading history...</div>
        ) : history.length === 0 ? (
          <p className="empty-state">No inspections have been recorded for this outlet.</p>
        ) : (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inspection Number</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>{item.inspectionNumber}</td>
                    <td>{new Date(item.inspectionDate).toLocaleDateString()}</td>
                    <td>{item.inspector?.name || 'N/A'}</td>
                    <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                    <td>
                      {item.status === 'FINAL_APPROVED' ? (
                        <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => window.open(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/inspections/${item._id}/pdf`, '_blank')}>
                          PDF
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => navigate(`/inspections/${item._id}`)}>
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
