import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiRequest from '../services/api';
import SignaturePad from '../components/SignaturePad';
import ProgressBar from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';

const OUTLET_TYPES = [
  { value: 'AGROVET', label: 'Agrovet' },
  { value: 'CHEMIST', label: 'Chemist' },
  { value: 'OTHER', label: 'Others' },
];

const PRODUCT_OPTIONS = [
  { key: 'animalHealthPartI', label: 'Animal Health Part I' },
  { key: 'animalHealthPartII', label: 'Animal Health Part II' },
  { key: 'vaccines', label: 'Vaccines' },
  { key: 'agricultural', label: 'Agricultural' },
  { key: 'feedsAndSalts', label: 'Feeds and Salts' },
];

const FINDING_FIELDS = [
  ['ownerProfessionalCertificate', 'Owner certificate'],
  ['attendantsProfessionalCertificate', 'Attendant(s) certificate'],
  ['licenses', 'Licenses'],
  ['site', 'Site'],
  ['building', 'Building'],
  ['ventilation', 'Ventilation'],
  ['floorAndWalls', 'Floor and walls'],
  ['space', 'Space'],
  ['stockArrangement', 'Arrangement of stock'],
  ['stockStorage', 'Storage of stock'],
  ['authenticity', 'Authenticity, labelling and viability'],
  ['disposal', 'Disposal of expired drugs and other chemicals'],
];

const initialForm = {
  inspectionDetails: {
    inspectionNumber: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
  },
  outletInformation: {
    outletName: '',
    outletType: 'AGROVET',
    county: '',
    subCounty: '',
    centre: '',
  },
  ownerInformation: {
    ownerName: '',
    address: '',
    phone: '',
    email: '',
  },
  kvbStatus: {
    registrationNumber: '',
    retention: '',
    practice: '',
    ownerTrainingLevel: '',
    attendantTrainingLevel: '',
  },
  attendants: [
    { name: '', phone: '', kvbNumber: '', retention: '', practice: '' },
  ],
  products: {
    animalHealthPartI: false,
    animalHealthPartII: false,
    vaccines: false,
    agricultural: false,
    feedsAndSalts: false,
    others: '',
  },
  findings: {
    ownerProfessionalCertificate: '',
    attendantsProfessionalCertificate: '',
    licenses: '',
    site: '',
    building: '',
    ventilation: '',
    floorAndWalls: '',
    space: '',
    stockArrangement: '',
    stockStorage: '',
    authenticity: '',
    disposal: '',
    otherComments: '',
  },
  comments: '',
  location: {
    latitude: '',
    longitude: '',
    capturedAt: '',
  },
  signature: {
    name: '',
    role: 'INSPECTOR',
    capturedAt: '',
    data: '',
  },
};

const steps = [
  'Inspection Details',
  'Outlet Information',
  'Owner Information',
  'Attendants and KVB Status',
  'Products Stocked',
  'Inspection Findings',
  'Comments and Location',
  'Signature',
  'Review',
  'Submit',
];

export default function InspectionEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(location.state?.step || 0);
  const [inspection, setInspection] = useState(null);
  const [form, setForm] = useState(JSON.parse(JSON.stringify(initialForm)));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const data = await apiRequest(`/inspections/${id}`);
        const existing = data.item;
        const nextForm = {
          ...JSON.parse(JSON.stringify(initialForm)),
          ...(existing.formData || {}),
          inspectionDetails: {
            ...initialForm.inspectionDetails,
            ...(existing.formData?.inspectionDetails || {}),
            inspectionNumber: existing.inspectionNumber || '',
          },
          outletInformation: {
            ...initialForm.outletInformation,
            ...(existing.formData?.outletInformation || {}),
          },
          ownerInformation: {
            ...initialForm.ownerInformation,
            ...(existing.formData?.ownerInformation || {}),
          },
          kvbStatus: {
            ...initialForm.kvbStatus,
            ...(existing.formData?.kvbStatus || {}),
          },
          attendants: existing.formData?.attendants?.length ? existing.formData.attendants : initialForm.attendants,
          products: { ...initialForm.products, ...(existing.formData?.products || {}) },
          findings: { ...initialForm.findings, ...(existing.formData?.findings || {}) },
          location: { ...initialForm.location, ...(existing.formData?.location || {}) },
          signature: { ...initialForm.signature, ...(existing.formData?.signature || {}) },
        };

        setInspection(existing);
        setForm(nextForm);
      } catch (err) {
        setError(err.message || 'Unable to load inspection.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspection();

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, hasUnsavedChanges]);

  const updateField = (section, key, value) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  const updateAttendant = (index, key, value) => {
    setForm((prev) => {
      const attendants = [...prev.attendants];
      attendants[index] = { ...attendants[index], [key]: value };
      setHasUnsavedChanges(true);
      return { ...prev, attendants };
    });
  };

  const addAttendant = () => {
    setForm((prev) => ({
      ...prev,
      attendants: [
        ...prev.attendants,
        { name: '', phone: '', kvbNumber: '', retention: '', practice: '' },
      ],
    }));
    setHasUnsavedChanges(true);
  };

  const removeAttendant = (index) => {
    if (form.attendants.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      attendants: prev.attendants.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      await apiRequest(`/inspections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          formData: form,
          status: 'DRAFT',
          draft: true,
        }),
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.message || 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleAutoSave = useCallback(async () => {
    if (inspection && !hasUnsavedChanges) return;
    if (inspection?.status === 'FINAL_APPROVED' || inspection?.isLocked) return;

    try {
      await apiRequest(`/inspections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          formData: form,
          status: inspection?.status || 'DRAFT',
          draft: true,
        }),
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Auto-save failed:', err.message);
    }
  }, [id, form, hasUnsavedChanges, inspection]);

  const handleReview = async () => {
    try {
      setSaving(true);
      await apiRequest(`/inspections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          formData: form,
          status: 'DRAFT',
          draft: true,
        }),
      });
      setHasUnsavedChanges(false);
      navigate(`/inspections/${id}/review`, { state: { from: 'editor' } });
    } catch (err) {
      setError(err.message || 'Unable to proceed to review.');
    } finally {
      setSaving(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('location', 'latitude', String(position.coords.latitude));
        updateField('location', 'longitude', String(position.coords.longitude));
        updateField('location', 'capturedAt', new Date().toISOString());
      },
      () => {
        setError('Location permission was not granted. Coordinates can be entered manually.');
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  };

  const handleSignature = (dataUrl) => {
    updateField('signature', 'data', dataUrl);
    updateField('signature', 'capturedAt', new Date().toISOString());
  };

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <div className="form-grid two-col">
          <label className="field-label">
            Inspection Number
            <input value={form.inspectionDetails.inspectionNumber} readOnly style={{ background: '#f9faf7', color: 'var(--kvb-muted)' }} />
            <small style={{ color: 'var(--kvb-muted)' }}>Auto-generated by the system</small>
          </label>
          <label className="field-label">
            Inspection Date
            <input type="date" value={form.inspectionDetails.inspectionDate} onChange={(e) => updateField('inspectionDetails', 'inspectionDate', e.target.value)} />
          </label>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <div className="form-grid two-col">
          <label className="field-label">
            Name of Outlet
            <input value={form.outletInformation.outletName} onChange={(e) => updateField('outletInformation', 'outletName', e.target.value)} />
          </label>
          <label className="field-label">
            Type of Outlet
            <select value={form.outletInformation.outletType} onChange={(e) => updateField('outletInformation', 'outletType', e.target.value)}>
              {OUTLET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            County
            <input value={form.outletInformation.county} onChange={(e) => updateField('outletInformation', 'county', e.target.value)} />
          </label>
          <label className="field-label">
            Sub-County
            <input value={form.outletInformation.subCounty} onChange={(e) => updateField('outletInformation', 'subCounty', e.target.value)} />
          </label>
          <label className="field-label full-width">
            Centre
            <input value={form.outletInformation.centre} onChange={(e) => updateField('outletInformation', 'centre', e.target.value)} />
          </label>
        </div>
      );
    }

    if (stepIndex === 2) {
      return (
        <div className="form-grid two-col">
          <label className="field-label">
            Owner's Name
            <input value={form.ownerInformation.ownerName} onChange={(e) => updateField('ownerInformation', 'ownerName', e.target.value)} />
          </label>
          <label className="field-label">
            Telephone Number
            <input value={form.ownerInformation.phone} onChange={(e) => updateField('ownerInformation', 'phone', e.target.value)} />
          </label>
          <label className="field-label full-width">
            Address
            <input value={form.ownerInformation.address} onChange={(e) => updateField('ownerInformation', 'address', e.target.value)} />
          </label>
          <label className="field-label full-width">
            Email Address
            <input type="email" value={form.ownerInformation.email} onChange={(e) => updateField('ownerInformation', 'email', e.target.value)} />
          </label>
        </div>
      );
    }

    if (stepIndex === 3) {
      return (
        <div className="stacked-panel">
          <div className="panel" style={{ background: '#f9faf7' }}>
            <h3>KVB Status</h3>
            <div className="form-grid two-col">
              <label className="field-label">
                Registration Number
                <input value={form.kvbStatus.registrationNumber} onChange={(e) => updateField('kvbStatus', 'registrationNumber', e.target.value)} />
              </label>
              <label className="field-label">
                Retention
                <input value={form.kvbStatus.retention} onChange={(e) => updateField('kvbStatus', 'retention', e.target.value)} placeholder="e.g. Current, Expired" />
              </label>
              <label className="field-label full-width">
                Practice
                <input value={form.kvbStatus.practice} onChange={(e) => updateField('kvbStatus', 'practice', e.target.value)} placeholder="e.g. Active, Inactive" />
              </label>
              <label className="field-label full-width">
                Owner Training Level
                <input value={form.kvbStatus.ownerTrainingLevel || ''} onChange={(e) => updateField('kvbStatus', 'ownerTrainingLevel', e.target.value)} />
                <small style={{ color: 'var(--kvb-muted)' }}>Requires KVB confirmation - configurable field</small>
              </label>
              <label className="field-label full-width">
                Attendant Training Level
                <input value={form.kvbStatus.attendantTrainingLevel || ''} onChange={(e) => updateField('kvbStatus', 'attendantTrainingLevel', e.target.value)} />
                <small style={{ color: 'var(--kvb-muted)' }}>Requires KVB confirmation - configurable field</small>
              </label>
            </div>
          </div>

          <div className="stacked-panel">
            {form.attendants.map((attendant, index) => (
              <div key={index} className="attendant-box">
                <h3>Attendant {index + 1}</h3>
                <div className="form-grid two-col">
                  <label className="field-label">
                    Name
                    <input value={attendant.name} onChange={(e) => updateAttendant(index, 'name', e.target.value)} />
                  </label>
                  <label className="field-label">
                    Telephone Number
                    <input value={attendant.phone} onChange={(e) => updateAttendant(index, 'phone', e.target.value)} />
                  </label>
                  <label className="field-label">
                    KVB Registration Number
                    <input value={attendant.kvbNumber} onChange={(e) => updateAttendant(index, 'kvbNumber', e.target.value)} />
                  </label>
                  <label className="field-label">
                    Retention
                    <input value={attendant.retention} onChange={(e) => updateAttendant(index, 'retention', e.target.value)} />
                  </label>
                  <label className="field-label">
                    Practice
                    <input value={attendant.practice} onChange={(e) => updateAttendant(index, 'practice', e.target.value)} />
                  </label>
                  {form.attendants.length > 1 && (
                    <label className="field-label">
                      &mdash;
                      <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => removeAttendant(index)}>
                        Remove
                      </button>
                    </label>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" onClick={addAttendant}>Add Attendant</button>
          </div>
        </div>
      );
    }

    if (stepIndex === 4) {
      return (
        <div className="stacked-panel">
          <div className="checkbox-grid">
            {PRODUCT_OPTIONS.map((opt) => (
              <label key={opt.key} className="check-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.products[opt.key])}
                  onChange={(e) => updateField('products', opt.key, e.target.checked)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <label className="field-label full-width">
            Others
            <input value={form.products.others || ''} onChange={(e) => updateField('products', 'others', e.target.value)} />
          </label>
        </div>
      );
    }

    if (stepIndex === 5) {
      return (
        <div className="form-grid two-col">
          {FINDING_FIELDS.map(([key, label]) => (
            <label key={key} className="field-label">
              {label}
              <input value={form.findings[key] || ''} onChange={(e) => updateField('findings', key, e.target.value)} />
            </label>
          ))}
          <label className="field-label full-width">
            Other comments
            <textarea
              value={form.findings.otherComments || ''}
              onChange={(e) => updateField('findings', 'otherComments', e.target.value)}
              rows="4"
            />
          </label>
        </div>
      );
    }

    if (stepIndex === 6) {
      return (
        <div className="form-grid two-col">
          <label className="field-label full-width">
            Inspection comments
            <textarea
              value={form.comments}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, comments: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              rows="4"
            />
          </label>
          <label className="field-label">
            Latitude
            <input value={form.location.latitude || ''} onChange={(e) => updateField('location', 'latitude', e.target.value)} readOnly={!form.location.capturedAt} />
          </label>
          <label className="field-label">
            Longitude
            <input value={form.location.longitude || ''} onChange={(e) => updateField('location', 'longitude', e.target.value)} readOnly={!form.location.capturedAt} />
          </label>
          <div className="button-block full-width">
            <button type="button" className="btn btn-secondary" onClick={captureLocation}>
              Capture GPS
            </button>
          </div>
        </div>
      );
    }

    if (stepIndex === 7) {
      return (
        <div className="form-grid two-col">
          <label className="field-label">
            Signature name
            <input
              value={form.signature.name || ''}
              onChange={(e) => updateField('signature', 'name', e.target.value)}
            />
          </label>
          <label className="field-label">
            Role
            <input value={form.signature.role || 'INSPECTOR'} readOnly />
          </label>
          <div className="button-block full-width">
            <SignaturePad
              onSignature={handleSignature}
              initialValue={form.signature.data}
              width={380}
              height={160}
            />
          </div>
          {form.signature.capturedAt && (
            <label className="field-label full-width">
              Signature captured
              <small style={{ color: 'var(--kvb-muted)' }}>{new Date(form.signature.capturedAt).toLocaleString()}</small>
            </label>
          )}
        </div>
      );
    }

    if (stepIndex === 8) {
      const selectedProducts = Object.entries(form.products)
        .filter(([k, v]) => k !== 'others' && v === true)
        .map(([k]) => PRODUCT_OPTIONS.find((p) => p.key === k)?.label || k)
        .join(', ');

      return (
        <div className="stacked-panel">
          <div className="panel review-panel">
            <h3>Review Inspection</h3>
            <dl>
              <div><dt>Inspection Number</dt><dd>{form.inspectionDetails.inspectionNumber || 'Not set'}</dd></div>
              <div><dt>Inspection Date</dt><dd>{form.inspectionDetails.inspectionDate || 'Not set'}</dd></div>
              <div><dt>Outlet</dt><dd>{form.outletInformation.outletName || 'Not set'}</dd></div>
              <div><dt>Type of Outlet</dt><dd>{form.outletInformation.outletType || 'Not set'}</dd></div>
              <div><dt>County</dt><dd>{form.outletInformation.county || 'Not set'}</dd></div>
              <div><dt>Sub-County</dt><dd>{form.outletInformation.subCounty || 'Not set'}</dd></div>
              <div><dt>Centre</dt><dd>{form.outletInformation.centre || 'Not set'}</dd></div>
              <div><dt>Owner</dt><dd>{form.ownerInformation.ownerName || 'Not set'}</dd></div>
              <div><dt>Phone</dt><dd>{form.ownerInformation.phone || 'Not set'}</dd></div>
              <div><dt>Email</dt><dd>{form.ownerInformation.email || 'Not set'}</dd></div>
              <div><dt>Address</dt><dd>{form.ownerInformation.address || 'Not set'}</dd></div>
              <div><dt>KVB Registration</dt><dd>{form.kvbStatus?.registrationNumber || 'Not set'}</dd></div>
              <div><dt>Retention</dt><dd>{form.kvbStatus?.retention || 'Not set'}</dd></div>
              <div><dt>Practice</dt><dd>{form.kvbStatus?.practice || 'Not set'}</dd></div>
              <div><dt>Attendants</dt><dd>{form.attendants.length} attendant(s) recorded</dd></div>
              <div><dt>Products</dt><dd>{selectedProducts || 'None selected'}</dd></div>
              <div><dt>Comments</dt><dd>{form.comments || 'No comments provided'}</dd></div>
              <div><dt>GPS</dt><dd>{form.location.latitude ? `${form.location.latitude}, ${form.location.longitude}` : 'Not captured'}</dd></div>
              <div><dt>Signature</dt><dd>{form.signature.name || 'Not signed'}</dd></div>
            </dl>
          </div>
        </div>
      );
    }

    return (
      <div className="panel review-panel">
        <h3>Submit Inspection</h3>
        <p>Before final submission, confirm the inspection details and then submit to the Director for review.</p>
        <p style={{ color: 'var(--kvb-muted)' }}>
          Once submitted, the inspection will enter the formal approval workflow.
          You will be able to view and correct any issues if it is returned.
        </p>
      </div>
    );
  };

  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;
  const isLastStep = stepIndex === steps.length - 1;
  const isFinalApproved = inspection?.status === 'FINAL_APPROVED' || inspection?.isLocked;

  if (loading) {
    return <div className="page-shell"><div className="loader">Loading inspection form...</div></div>;
  }

  if (!inspection) {
    return <div className="page-shell"><div className="panel"><h2>Inspection not found</h2></div></div>;
  }

  const returnReason = inspection.status === 'RETURNED_TO_INSPECTOR'
    ? [...(inspection.workflowHistory || []),].reverse().find((h) => h.action === 'RETURNED_TO_INSPECTOR')?.reason
    : '';

  if (isFinalApproved) {
    return (
      <div className="content-stack narrow-box">
        <div className="page-header">
          <div>
            <p className="eyebrow">Locked Inspection</p>
            <h1>{inspection.inspectionNumber}</h1>
            <StatusBadge status={inspection.status} />
          </div>
        </div>
        <div className="panel">
          <p>This inspection has been final approved and is locked. It cannot be modified.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/inspections/${id}`)}>
            View Inspection Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">KVB Inspection</p>
          <h1>{inspection.inspectionNumber}</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={saveDraft} disabled={saving || isFinalApproved}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {returnReason && (
         <div className="panel" style={{ border: '1px solid var(--kvb-danger)', borderRadius: 12, background: 'rgba(220, 38, 38, 0.04)' }}>
           <h2 style={{ color: 'var(--kvb-danger)', fontSize: 14, marginBottom: 8 }}>Returned for Correction</h2>
           <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--kvb-border)', fontSize: 13 }}>
            {returnReason}
          </div>
        </div>
      )}

      <ProgressBar steps={steps} currentStep={stepIndex} onStepClick={isFinalApproved ? null : undefined} />

      <div className="panel form-panel">
        <div className="section-header">
          <h2>{steps[stepIndex]}</h2>
        </div>

        {error && <div className="form-error">{error}</div>}

        {renderStepContent()}

        <div className="action-row justify-end">
          {canGoBack && (
            <button type="button" className="btn btn-secondary" onClick={handlePrevious}>
              Previous
            </button>
          )}
          {canGoNext ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleReview} disabled={saving}>
              {saving ? 'Saving...' : 'Continue to Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

