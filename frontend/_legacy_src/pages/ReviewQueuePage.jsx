import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import Pagination from '../components/Pagination';

const statusLabels = {
  PENDING_DIRECTOR_REVIEW: 'Pending Review',
  DIRECTOR_APPROVED: 'Director Approved',
  RETURNED_TO_INSPECTOR: 'Returned to Inspector',
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 25;

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest(`/inspections?page=${page}&limit=${limit}&status=PENDING_DIRECTOR_REVIEW`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load review queue.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [page]);

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Director review</p>
          <h1>Inspection review queue</h1>
        </div>
      </div>

      <div className="panel">
        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="loader">Loading review queue...</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No inspections are awaiting director review.</p>
        ) : (
          <>
            <div className="list-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inspection</th>
                    <th>Outlet</th>
                    <th>Inspector</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.inspectionNumber}</td>
                      <td>{item.outlet?.outletName || item.formData?.outletInformation?.outletName || 'N/A'}</td>
                      <td>{item.inspector?.name || 'N/A'}</td>
                      <td>{new Date(item.inspectionDate).toLocaleDateString()}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <Link to={`/review/${item._id}`} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          Review
                        </Link>
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
