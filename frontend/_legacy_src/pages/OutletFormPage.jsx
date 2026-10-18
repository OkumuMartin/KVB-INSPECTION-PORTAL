import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiRequest from '../services/api';

const OUTLET_TYPES = [
  { value: 'AGROVET', label: 'Agrovet' },
  { value: 'CHEMIST', label: 'Chemist' },
  { value: 'OTHER', label: 'Others' },
];

export default function OutletFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    outletName: '',
    outletType: 'AGROVET',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    address: '',
    county: '',
    subCounty: '',
    centre: '',
    kvbRegistrationInfo: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchOutlet = async () => {
        try {
          const data = await apiRequest(`/outlets/${id}`);
          const item = data.item;
          setForm({
            outletName: item.outletName || '',
            outletType: item.outletType || 'AGROVET',
            ownerName: item.ownerName || '',
            ownerEmail: item.ownerEmail || '',
            ownerPhone: item.ownerPhone || '',
            address: item.address || '',
            county: item.county || '',
            subCounty: item.subCounty || '',
            centre: item.centre || '',
            kvbRegistrationInfo: item.kvbRegistrationInfo || '',
          });
        } catch (err) {
          setError(err.message || 'Unable to load outlet.');
        } finally {
          setLoading(false);
        }
      };

      fetchOutlet();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await apiRequest(`/outlets/${id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiRequest('/outlets', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      navigate('/outlets');
    } catch (err) {
      setError(err.message || 'Unable to save outlet.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/outlets');
  };

  if (loading) return <div className="loader">Loading outlet...</div>;

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Outlet</p>
          <h1>{isEdit ? 'Edit Outlet' : 'Create New Outlet'}</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="panel form-panel">
        <div className="section-header">
          <h2>Outlet Information</h2>
        </div>

        <div className="form-grid two-col">
          <label className="field-label">
            Name of Outlet *
            <input
              type="text"
              name="outletName"
              value={form.outletName}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field-label">
            Type of Outlet *
            <select name="outletType" value={form.outletType} onChange={handleChange} required>
              {OUTLET_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            County
            <input type="text" name="county" value={form.county} onChange={handleChange} />
          </label>
          <label className="field-label">
            Sub-County
            <input type="text" name="subCounty" value={form.subCounty} onChange={handleChange} />
          </label>
          <label className="field-label full-width">
            Centre
            <input type="text" name="centre" value={form.centre} onChange={handleChange} />
          </label>
        </div>

        <div className="section-header">
          <h2>Owner Information</h2>
        </div>

        <div className="form-grid two-col">
          <label className="field-label">
            Owner's Name *
            <input type="text" name="ownerName" value={form.ownerName} onChange={handleChange} required />
          </label>
          <label className="field-label">
            Telephone Number
            <input type="tel" name="ownerPhone" value={form.ownerPhone} onChange={handleChange} />
          </label>
          <label className="field-label full-width">
            Email Address
            <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleChange} />
          </label>
          <label className="field-label full-width">
            Address
            <input type="text" name="address" value={form.address} onChange={handleChange} />
          </label>
          <label className="field-label full-width">
            KVB Registration Number
            <input type="text" name="kvbRegistrationInfo" value={form.kvbRegistrationInfo} onChange={handleChange} placeholder="e.g. REG-2026-001" />
          </label>
        </div>

        <div className="action-row justify-end">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Outlet' : 'Create Outlet')}
          </button>
        </div>
      </form>
    </div>
  );
}
