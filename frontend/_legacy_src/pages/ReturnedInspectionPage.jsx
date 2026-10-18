import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiRequest from '../services/api';

export default function ReturnedInspectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const data = await apiRequest(`/inspections/${id}`);
        const item = data.item;
        if (item.status !== 'RETURNED_TO_INSPECTOR') {
          navigate('/dashboard');
          return;
        }
        setInspection(item);
      } catch (err) {
        setError(err.message || 'Unable to load inspection.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id, navigate]);

  const returnReason = inspection?.workflowHistory?.find(
    (h) => h.action === 'RETURNED_TO_INSPECTOR',
  )?.reason || '';

  const handleResubmit = async () => {
    if (!window.confirm('Are you sure you want to resubmit this inspection after corrections?')) {
      return;
    }

    try {
      setResubmitting(true);
      await apiRequest(`/inspections/${id}/submit`, { method: 'POST', body: JSON.stringify({}) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to resubmit inspection.');
    } finally {
      setResubmitting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/inspections/${id}/edit`);
  };

  if (loading) {
    return <div className="loader">Loading inspection...</div>;
  }

  if (!inspection) {
    return <div className="panel"><h2>Inspection not found</h2></div>;
  }

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Returned Inspection</p>
          <h1>{inspection.inspectionNumber}</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel" style={{ border: '1px solid var(--kvb-danger)', borderRadius: 12, background: 'rgba(220, 38, 38, 0.04)' }}>
        <h2 style={{ color: 'var(--kvb-danger)', fontSize: 14, marginBottom: 8 }}>Return Reason</h2>
        <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--kvb-border)' }}>
          {returnReason || 'No reason provided.'}
        </div>
      </div>

      <div className="panel">
        <h2>Correction Instructions</h2>
        <p style={{ color: 'var(--kvb-muted)' }}>
          Review the return reason above, make the necessary corrections in the inspection form,
          and then resubmit. All previous submission data and workflow history are preserved.
        </p>
      </div>

      <div className="action-row justify-end">
        <button type="button" className="btn btn-secondary" onClick={handleEdit}>
          Edit Inspection
        </button>
        <button type="button" className="btn btn-primary" onClick={handleResubmit} disabled={resubmitting}>
          {resubmitting ? 'Resubmitting...' : 'Resubmit Inspection'}
        </button>
      </div>
    </div>
  );
}
