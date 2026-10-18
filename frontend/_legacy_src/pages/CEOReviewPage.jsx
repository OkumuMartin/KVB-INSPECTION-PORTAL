import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiRequest from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

function InfoRow({ label, value, fullWidth = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: fullWidth ? '1fr' : '220px 1fr', gap: '0.6rem', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
      <span style={{ fontWeight: 600, color: 'var(--kvb-muted)' }}>{label}</span>
      <span style={{ color: '#202a2f' }}>{value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
       <h2 style={{ color: 'var(--kvb-green-dark)', borderBottom: '2px solid var(--kvb-green)', paddingBottom: 6, fontSize: 14, margin: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function CEOReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);

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

  const handleApprove = async () => {
    if (!window.confirm('Do you approve this inspection for FINAL APPROVAL? This will lock the record and cannot be undone.')) {
      return;
    }

    try {
      setApproving(true);
      await apiRequest(`/inspections/${id}/final-approve`, { method: 'POST', body: JSON.stringify({}) });
      navigate('/final-review');
    } catch (err) {
      setError(err.message || 'Unable to complete final approval.');
    } finally {
      setApproving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) return;

    try {
      setReturning(true);
      await apiRequest(`/inspections/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({ reason: returnReason }),
      });
      navigate('/final-review');
    } catch (err) {
      setError(err.message || 'Unable to return inspection.');
    } finally {
      setReturning(false);
      setShowReturnDialog(false);
      setReturnReason('');
    }
  };

  if (loading) return <div className="loader">Loading inspection...</div>;
  if (!inspection) return <div className="panel"><h2>Inspection not found</h2></div>;

  const form = inspection.formData || {};
  const workflow = inspection.workflowHistory || [];
  const finalApproval = inspection.finalApproval || {};

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Final Review</p>
          <h1>{inspection.inspectionNumber}</h1>
          <StatusBadge status={inspection.status} />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Section title="A. Inspection Details">
        <InfoRow label="Inspection Number" value={inspection.inspectionNumber} />
        <InfoRow label="Inspection Date" value={new Date(inspection.inspectionDate).toLocaleDateString()} />
        <InfoRow label="Inspector" value={inspection.inspector?.name || 'N/A'} />
        <InfoRow label="Outlet" value={inspection.outlet?.outletName || form.outletInformation?.outletName || 'N/A'} />
        <InfoRow label="Locked" value={inspection.isLocked ? 'Yes' : 'No'} />
      </Section>

      <Section title="B. Outlet Information">
        <InfoRow label="Name of Outlet" value={form.outletInformation?.outletName || inspection.outlet?.outletName} />
        <InfoRow label="Type of Outlet" value={form.outletInformation?.outletType || inspection.outlet?.outletType} />
        <InfoRow label="County" value={form.outletInformation?.county || inspection.outlet?.county} />
        <InfoRow label="Sub-County" value={form.outletInformation?.subCounty || inspection.outlet?.subCounty} />
        <InfoRow label="Centre" value={form.outletInformation?.centre || inspection.outlet?.centre} />
      </Section>

      <Section title="C. Owner Information">
        <InfoRow label="Owner's Name" value={form.ownerInformation?.ownerName} />
        <InfoRow label="Address" value={form.ownerInformation?.address} />
        <InfoRow label="Telephone" value={form.ownerInformation?.phone} />
        <InfoRow label="Email" value={form.ownerInformation?.email} />
      </Section>

      <Section title="D. KVB Status">
        <InfoRow label="Registration Number" value={form.kvbStatus?.registrationNumber || inspection.outlet?.kvbRegistrationInfo} />
        <InfoRow label="Retention" value={form.kvbStatus?.retention} />
        <InfoRow label="Practice" value={form.kvbStatus?.practice} />
      </Section>

      <Section title="E. Attendants">
        {form.attendants && form.attendants.length > 0 ? (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Phone</th><th>KVB Reg No.</th><th>Retention</th><th>Practice</th></tr></thead>
              <tbody>
                {form.attendants.map((a, i) => (
                  <tr key={i}>
                    <td>{a.name || ''}</td><td>{a.phone || ''}</td><td>{a.kvbNumber || ''}</td><td>{a.retention || ''}</td><td>{a.practice || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty-state">No attendants recorded.</p>}
      </Section>

      <Section title="F. Products Stocked">
        {form.products && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            {form.products.animalHealthPartI && <span>&#10003; Animal Health Part I</span>}
            {form.products.animalHealthPartII && <span>&#10003; Animal Health Part II</span>}
            {form.products.vaccines && <span>&#10003; Vaccines</span>}
            {form.products.agricultural && <span>&#10003; Agricultural</span>}
            {form.products.feedsAndSalts && <span>&#10003; Feeds and Salts</span>}
            {form.products.others && <span>&#10003; Others: {form.products.others}</span>}
          </div>
        )}
      </Section>

      <Section title="G. Inspection Findings">
        {form.findings && Object.keys(form.findings).length > 0 && (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead><tr><th>Item</th><th>Response</th></tr></thead>
              <tbody>
                {Object.entries(form.findings).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                    <td>{value || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="H. Comments, Location & Signature">
        <InfoRow label="Comments" value={form.comments} fullWidth />
        {form.location?.latitude && <InfoRow label="Latitude" value={form.location.latitude} />}
        {form.location?.longitude && <InfoRow label="Longitude" value={form.location.longitude} />}
        {form.signature?.name && <InfoRow label="Inspector Signature" value={form.signature.name} />}
      </Section>

      <Section title="Director Decision">
        <InfoRow label="Director Approval" value={finalApproval.approver ? 'Approved' : 'Not yet approved'} />
        <InfoRow label="Director Signature" value={finalApproval?.signature?.name || 'N/A'} />
      </Section>

      <Section title="Workflow History">
        <div className="list-table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Role</th><th>Action</th><th>Reason</th></tr></thead>
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
      </Section>

      <div className="panel" style={{ background: 'var(--kvb-green-dark)', borderRadius: 12, marginTop: 16 }}>
        <h2 style={{ color: 'white', fontSize: 14, margin: '0 0 8px' }}>CEO / Registrar Actions</h2>
        <div className="action-row">
          <button type="button" className="btn" style={{ background: '#e7f8ee', color: '#116c3a' }} onClick={handleApprove} disabled={approving}>
            {approving ? 'Final Approving...' : 'Final Approval'}
          </button>
           <button type="button" className="btn" style={{ background: '#fff3e8', color: '#b85c00', border: '1px solid var(--kvb-border)' }} onClick={() => setShowReturnDialog(true)}>
             Return for Correction
           </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>
          Final approval will lock this inspection record. This action cannot be undone.
        </p>
      </div>

      {showReturnDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel" style={{ maxWidth: 500, width: '90%', borderRadius: 14 }}>
            <h2 style={{ color: 'var(--kvb-danger)', fontSize: 16, margin: '0 0 12px' }}>Return Inspection for Correction</h2>
            <label className="field-label">
              Reason for return
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows="4"
                placeholder="Explain what needs to be corrected..."
              />
            </label>
            <div className="action-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowReturnDialog(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleReturn} disabled={returning || !returnReason.trim()}>
                {returning ? 'Returning...' : 'Return Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

