import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiRequest from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

const statusLabels = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Director Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

function InfoRow({ label, value }) {
  return (
    <div className="review-panel" style={{ marginBottom: 2 }}>
      <dl>
        <div>
          <dt>{label}</dt>
          <dd>{value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'}</dd>
        </div>
      </dl>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
       <h2 style={{ color: 'var(--kvb-green-dark)', borderBottom: '2px solid var(--kvb-green)', paddingBottom: 6, fontSize: 14 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function InspectionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this inspection for Director review? Once submitted, it will enter the approval workflow.')) {
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest(`/inspections/${id}/submit`, { method: 'POST', body: JSON.stringify({}) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to submit inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/inspections/${id}/edit`);
  };

  if (loading) {
    return <div className="loader">Loading inspection...</div>;
  }

  if (!inspection) {
    return <div className="panel"><h2>Inspection not found</h2></div>;
  }

  const form = inspection.formData || {};

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Review Inspection</p>
          <h1>{inspection.inspectionNumber}</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Section title="A. Inspection Details">
        <InfoRow label="Inspection Number" value={inspection.inspectionNumber} />
        <InfoRow label="Inspection Date" value={new Date(inspection.inspectionDate).toLocaleDateString()} />
        <InfoRow label="Status" value={<StatusBadge status={inspection.status} />} />
      </Section>

      <Section title="B. Outlet Information">
        <InfoRow label="Name of Outlet" value={form.outletInformation?.outletName} />
        <InfoRow label="Type of Outlet" value={form.outletInformation?.outletType} />
        <InfoRow label="County" value={form.outletInformation?.county} />
        <InfoRow label="Sub-County" value={form.outletInformation?.subCounty} />
        <InfoRow label="Centre" value={form.outletInformation?.centre} />
      </Section>

      <Section title="C. Owner Information">
        <InfoRow label="Owner's Name" value={form.ownerInformation?.ownerName} />
        <InfoRow label="Address" value={form.ownerInformation?.address} />
        <InfoRow label="Telephone Number" value={form.ownerInformation?.phone} />
        <InfoRow label="Email Address" value={form.ownerInformation?.email} />
      </Section>

      <Section title="D. Level of Training in Animal Health">
        <InfoRow label="Owner Training Level" value={form.kvbStatus?.ownerTrainingLevel || 'Not specified'} />
        <InfoRow label="Attendant Training Level" value={form.kvbStatus?.attendantTrainingLevel || 'Not specified'} />
      </Section>

      <Section title="E. KVB Status">
        <InfoRow label="Registration Number" value={form.kvbStatus?.registrationNumber || inspection.outlet?.kvbRegistrationInfo} />
        <InfoRow label="Retention" value={form.kvbStatus?.retention} />
        <InfoRow label="Practice" value={form.kvbStatus?.practice} />
      </Section>

      <Section title="F. Attendants">
        {form.attendants && form.attendants.length > 0 ? (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>KVB Reg No.</th>
                  <th>Retention</th>
                  <th>Practice</th>
                </tr>
              </thead>
              <tbody>
                {form.attendants.map((a, i) => (
                  <tr key={i}>
                    <td>{a.name || ''}</td>
                    <td>{a.phone || ''}</td>
                    <td>{a.kvbNumber || ''}</td>
                    <td>{a.retention || ''}</td>
                    <td>{a.practice || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No attendants recorded.</p>
        )}
      </Section>

      <Section title="G. Type of Product Stocked">
        {form.products && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.products.animalHealthPartI && <span>Animal Health Part I</span>}
            {form.products.animalHealthPartII && <span>Animal Health Part II</span>}
            {form.products.vaccines && <span>Vaccines</span>}
            {form.products.agricultural && <span>Agricultural</span>}
            {form.products.feedsAndSalts && <span>Feeds and Salts</span>}
            {form.products.others && <span>Others: {form.products.others}</span>}
          </div>
        )}
      </Section>

      <Section title="H. Inspection Findings">
        {form.findings && Object.keys(form.findings).length > 0 && (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Item</th><th>Response</th></tr>
              </thead>
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

      <Section title="Comments and Location">
        <InfoRow label="Inspection Comments" value={form.comments} />
        {form.location && (form.location.latitude || form.location.longitude) && (
          <>
            <InfoRow label="Latitude" value={form.location.latitude} />
            <InfoRow label="Longitude" value={form.location.longitude} />
            <InfoRow label="GPS Captured At" value={form.location.capturedAt ? new Date(form.location.capturedAt).toLocaleString() : ''} />
          </>
        )}
        {form.signature && (
          <>
            <InfoRow label="Signature Name" value={form.signature.name} />
            <InfoRow label="Signature Role" value={form.signature.role} />
            <InfoRow label="Signature Date" value={form.signature.capturedAt ? new Date(form.signature.capturedAt).toLocaleString() : ''} />
          </>
        )}
      </Section>

      <div className="action-row justify-end">
        <button type="button" className="btn btn-secondary" onClick={handleBack}>Back to Edit</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </div>
  );
}
