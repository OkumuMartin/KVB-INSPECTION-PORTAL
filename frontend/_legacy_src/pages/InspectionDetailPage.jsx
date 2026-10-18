import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiRequest from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const data = await apiRequest(`/inspections/${id}`);
        setInspection(data.item);
      } catch (err) {
        setError(err.message || 'Unable to load inspection.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id]);

  const handlePdfDownload = () => {
    window.open(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/inspections/${id}/pdf`, '_blank');
  };

  if (loading) return <div className="loader">Loading inspection...</div>;
  if (!inspection) return <div className="panel"><h2>Inspection not found</h2></div>;

  const form = inspection.formData || {};
  const workflow = inspection.workflowHistory || [];

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inspection Details</p>
          <h1>{inspection.inspectionNumber}</h1>
          <StatusBadge status={inspection.status} />
        </div>
        <div className="action-row">
          <button type="button" className="btn btn-secondary" onClick={handlePdfDownload}>
            Download PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <h2>Inspection Details</h2>
        <dl className="review-panel">
          <div><dt>Inspection Number</dt><dd>{inspection.inspectionNumber}</dd></div>
          <div><dt>Inspection Date</dt><dd>{new Date(inspection.inspectionDate).toLocaleDateString()}</dd></div>
          <div><dt>Outlet</dt><dd>{inspection.outlet?.outletName || 'N/A'}</dd></div>
          <div><dt>Inspector</dt><dd>{inspection.inspector?.name || 'N/A'}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={inspection.status} /></dd></div>
          <div><dt>Locked</dt><dd>{inspection.isLocked ? 'Yes' : 'No'}</dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>Outlet Information</h2>
        <dl className="review-panel">
          <div><dt>Name</dt><dd>{form.outletInformation?.outletName || 'N/A'}</dd></div>
          <div><dt>Type</dt><dd>{form.outletInformation?.outletType || 'N/A'}</dd></div>
          <div><dt>County</dt><dd>{form.outletInformation?.county || 'N/A'}</dd></div>
          <div><dt>Sub-County</dt><dd>{form.outletInformation?.subCounty || 'N/A'}</dd></div>
          <div><dt>Centre</dt><dd>{form.outletInformation?.centre || 'N/A'}</dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>Owner Information</h2>
        <dl className="review-panel">
          <div><dt>Owner Name</dt><dd>{form.ownerInformation?.ownerName || 'N/A'}</dd></div>
          <div><dt>Email</dt><dd>{form.ownerInformation?.email || 'N/A'}</dd></div>
          <div><dt>Phone</dt><dd>{form.ownerInformation?.phone || 'N/A'}</dd></div>
          <div><dt>Address</dt><dd>{form.ownerInformation?.address || 'N/A'}</dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>Workflow History</h2>
        {workflow.length === 0 ? (
          <p className="empty-state">No workflow history recorded.</p>
        ) : (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Actor Role</th><th>Action</th><th>Reason</th></tr></thead>
              <tbody>
                {workflow.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.timestamp).toLocaleString()}</td>
                    <td>{h.role || ''}</td>
                    <td>{h.action}</td>
                    <td>{h.reason || ''}</td>
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
