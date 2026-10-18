import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiRequest from '../services/api';

export default function NewInspectionPage() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const data = await apiRequest('/outlets?limit=100');
        setOutlets(data.items || []);
      } catch (err) {
        setOutlets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const handleCreateInspection = async () => {
    if (!selectedOutletId) return;

    try {
      setCreating(true);
      setError('');
      const data = await apiRequest('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          outlet: selectedOutletId,
          inspectionDate: new Date().toISOString().slice(0, 10),
        }),
      });

      navigate(`/inspections/${data.item._id}/edit`);
    } catch (err) {
      setError(err.message || 'Unable to create inspection.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inspection</p>
          <h1>Create new inspection</h1>
        </div>
        <Link to="/outlets/new" className="btn btn-secondary">New Outlet</Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <h2>Select outlet</h2>

        {loading ? (
          <div className="loader">Loading outlets...</div>
        ) : outlets.length === 0 ? (
          <div className="stacked-panel">
            <p>No outlets available yet. Create an outlet record first.</p>
            <Link to="/outlets/new" className="btn btn-primary">Create Outlet Record</Link>
          </div>
        ) : (
          <>
            <label className="field-label">
              Outlet
              <select value={selectedOutletId} onChange={(e) => setSelectedOutletId(e.target.value)}>
                <option value="">-- Select an outlet --</option>
                {outlets.map((outlet) => (
                  <option key={outlet._id} value={outlet._id}>
                    {outlet.outletName} - {outlet.county || 'N/A'}
                  </option>
                ))}
              </select>
            </label>

            <div className="action-row top-gap">
              <button type="button" className="btn btn-primary" onClick={handleCreateInspection} disabled={creating || !selectedOutletId}>
                {creating ? 'Creating...' : 'Start inspection'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
