import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../services/api';
import Pagination from '../components/Pagination';

export default function InspectionReturnedPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 25;

  const loadReturned = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest(`/inspections?page=${page}&limit=${limit}&status=RETURNED_TO_INSPECTOR`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load returned inspections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturned();
  }, [page]);

  const getReturnReason = (inspection) => {
    const history = inspection.workflowHistory || [];
    const returned = [...history].reverse().find((h) => h.action === 'RETURNED_TO_INSPECTOR');
    return returned?.reason || 'No reason provided';
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Returned Inspections</p>
          <h1>Corrections Required</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <div className="loader">Loading returned inspections...</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No inspections have been returned for your review.</p>
        ) : (
          <>
            <div className="list-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inspection</th>
                    <th>Outlet</th>
                    <th>Return Reason</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.inspectionNumber}</td>
                      <td>{item.formData?.outletInformation?.outletName || 'N/A'}</td>
                      <td>{getReturnReason(item)}</td>
                      <td>{new Date(item.inspectionDate).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/inspections/${item._id}/returned`} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          Correct & Resubmit
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
