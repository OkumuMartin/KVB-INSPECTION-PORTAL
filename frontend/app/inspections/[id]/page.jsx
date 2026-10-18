'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { useInspectionForm } from '../../../hooks/useInspectionForm';
import { useInspectionFormSchema } from '../../../hooks/useInspectionFormSchema';
import { extractError, useSaveInspection, useSubmitInspection } from '../../../hooks/useInspectionActions';
import { clearLocalDraft, saveLocalDraft } from '../../../lib/draftStorage';
import { collectStepErrors, mergeFormData, PRODUCT_GROUPS, STEPS, toDateInputValue } from '../../../lib/inspectionForm';
import InspectionFormShell from '../../../components/inspections/InspectionFormShell';
import StepIndicator from '../../../components/inspections/StepIndicator';
import InspectionInfoStep from '../../../components/inspections/InspectionInfoStep';
import OutletDetailsStep from '../../../components/inspections/OutletDetailsStep';
import OwnerDetailsStep from '../../../components/inspections/OwnerDetailsStep';
import AttendantsStep from '../../../components/inspections/AttendantsStep';
import ProductsStep from '../../../components/inspections/ProductsStep';
import FindingsStep from '../../../components/inspections/FindingsStep';
import SignOffStep from '../../../components/inspections/SignOffStep';
import ReviewStep from '../../../components/inspections/ReviewStep';
import StatusBadge from '../../../components/StatusBadge';
import '../../../styles/InspectionForm.css';

const EDITABLE_STATUSES = ['DRAFT', 'RETURNED_TO_INSPECTOR'];

export default function InspectionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [banner, setBanner] = useState(null);
  const [mode, setMode] = useState('view');
  const [tab, setTab] = useState('form');
  const [audit, setAudit] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const hydratedRef = useRef(false);

  const { findingSections, findingStatuses, outletTypes, maxAttendants } = useInspectionFormSchema();
  const saveMutation = useSaveInspection();
  const submitMutation = useSubmitInspection();

  const form = useInspectionForm({});

  const {
    formData, outletId, inspectionDate, step, stepIndex, furthestStep, steps, errors,
    setOutletId, setInspectionDate, setErrors, setFurthestStep, hydrate,
    updateOutletField, updateOwnerField, updateOwnerKvbStatus, updateAttendant,
    updateAttendantKvbStatus, addAttendant, removeAttendant, toggleProduct,
    setOtherProductsDescription, setFinding, setOtherComments, setSignOff, setFormNumber,
    goToStep, nextStep, previousStep,
  } = form;

  const loadInspection = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const res = await api.get(`/inspections/${id}`);
      setRecord(res.data);

      if (!hydratedRef.current) {
        hydratedRef.current = true;
        hydrate({
          outletId: res.data.item?.outlet?._id || res.data.item?.outlet || '',
          inspectionDate: toDateInputValue(res.data.item?.inspectionDate),
          formData: mergeFormData(res.data.item?.formData, { inspectorName: user?.name || '' }),
          stepIndex: 0,
        });
      }
    } catch (error) {
      setLoadError(extractError(error).message);
    } finally {
      setLoading(false);
    }
  }, [id, hydrate, user, hydratedRef]);

  useEffect(() => {
    loadInspection();
  }, [loadInspection]);

  useEffect(() => {
    api.get('/outlets?limit=100')
      .then((res) => setOutlets(res.data.items || res.data || []))
      .catch(() => setOutlets([]));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !user) return;
    saveLocalDraft(user._id, { outletId, inspectionDate, formData, stepIndex });
  }, [mode, user, outletId, inspectionDate, formData, stepIndex]);

  const item = record?.item;
  const editable = Boolean(item) && EDITABLE_STATUSES.includes(item.status) && !item.isLocked;

  const loadAudit = useCallback(async () => {
    try {
      const res = await api.get(`/inspections/${id}/audit-log?limit=50`);
      setAudit(res.data);
    } catch (error) {
      setBanner({ type: 'error', message: extractError(error).message });
    }
  }, [id]);

  const handleSave = useCallback(async () => {
    setBanner(null);
    try {
      await saveMutation.mutateAsync({ id, outlet: outletId, inspectionDate, formData });
      clearLocalDraft(user._id);
      setBanner({ type: 'success', message: 'Inspection saved.' });
      await loadInspection();
    } catch (error) {
      const { message, errors: fieldErrors } = extractError(error);
      setBanner({ type: 'error', message, fieldErrors });
    }
  }, [saveMutation, id, outletId, inspectionDate, formData, user, loadInspection]);

  const handleSubmit = useCallback(async () => {
    for (const target of steps.map((entry) => entry.id)) {
      const stepErrors = collectStepErrors({
        step: target,
        formData,
        outletId,
        inspectionDate,
        sections: findingSections,
      });

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        goToStep(steps.findIndex((entry) => entry.id === target));
        setMode('edit');
        setBanner({ type: 'error', message: 'Complete every section before submitting.' });
        return;
      }
    }

    setBanner(null);
    try {
      if (mode === 'edit') await saveMutation.mutateAsync({ id, outlet: outletId, inspectionDate, formData });
      await submitMutation.mutateAsync(id);
      clearLocalDraft(user._id);
      setMode('view');
      await loadInspection();
    } catch (error) {
      const { message, errors: fieldErrors } = extractError(error);
      setBanner({ type: 'error', message, fieldErrors });
    }
  }, [steps, formData, outletId, inspectionDate, findingSections, setErrors, goToStep, mode, saveMutation, submitMutation, id, loadInspection, user]);

  const handleExport = useCallback(() => {
    const url = `${api.defaults.baseURL}/inspections/${id}/export?format=${exportFormat}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [id, exportFormat]);

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: 'fa-file-pdf' },
    { value: 'word', label: 'Word', icon: 'fa-file-word' },
    { value: 'excel', label: 'Excel', icon: 'fa-file-excel' },
  ];

  const validateStep = useCallback((targetStep = step) => {
    const stepErrors = collectStepErrors({
      step: targetStep,
      formData,
      outletId,
      inspectionDate,
      sections: findingSections,
    });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [step, formData, outletId, inspectionDate, findingSections, setErrors]);

  const handleContinue = useCallback(() => {
    if (!validateStep(step)) return;
    setFurthestStep((prev) => Math.max(prev, stepIndex + 1));
    nextStep();
  }, [step, stepIndex, validateStep, setFurthestStep, nextStep]);

  const handleSelectOutlet = useCallback((selectedId) => {
    setOutletId(selectedId);
    const outlet = outlets.find((entry) => entry._id === selectedId);
    if (!outlet) return;
    updateOutletField('outletName', outlet.outletName || '');
    updateOutletField('outletType', outlet.outletType || '');
    if (outlet.county) updateOutletField('county', outlet.county);
    if (outlet.subCounty) updateOutletField('subCounty', outlet.subCounty);
    updateOutletField('centre', outlet.centre || '');
    updateOwnerField('ownerName', outlet.ownerName || '');
    updateOwnerField('address', outlet.address || '');
    updateOwnerField('telephone', outlet.ownerPhone || '');
    updateOwnerField('ownerEmail', outlet.ownerEmail || '');
    updateOwnerField('trainingLevel', outlet.ownerTrainingLevel || '');
    updateOwnerKvbStatus('registrationNumber', outlet.kvbRegistrationInfo || '');
  }, [outlets, setOutletId, updateOutletField, updateOwnerField, updateOwnerKvbStatus]);

  const handleOutletCreated = useCallback((newOutlet) => {
    setOutletId(newOutlet._id);

    updateOutletField('outletName', newOutlet.outletName || '');
    updateOutletField('outletType', newOutlet.outletType || '');
    if (newOutlet.county) updateOutletField('county', newOutlet.county);
    if (newOutlet.subCounty) updateOutletField('subCounty', newOutlet.subCounty);
    updateOutletField('centre', newOutlet.centre || '');
    updateOwnerField('ownerName', newOutlet.ownerName || '');
    updateOwnerField('address', newOutlet.address || '');
    updateOwnerField('telephone', newOutlet.ownerPhone || '');
    updateOwnerField('ownerEmail', newOutlet.ownerEmail || '');
    updateOwnerField('trainingLevel', newOutlet.ownerTrainingLevel || '');
    updateOwnerKvbStatus('registrationNumber', newOutlet.kvbRegistrationInfo || '');

    setBanner({
      type: 'success',
      message: `Outlet '${newOutlet.outletName}' created and selected.`,
    });

    setOutlets((prev) => [...prev, newOutlet]);
  }, [setOutletId, updateOutletField, updateOwnerField, updateOwnerKvbStatus, setBanner, setOutlets]);

  if (loading) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Inspection">
          <p className="inspection-loading">Loading inspection…</p>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  if (loadError || !item) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Inspection">
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {loadError || 'Inspection not found.'}
          </div>
          <Link href="/inspections" className="btn btn-secondary">Back to inspections</Link>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  const compliance = record.compliance;

  return (
    <ProtectedRoute>
      <InspectionFormShell
        breadcrumb={item.inspectionNumber}
        title={`Inspection ${item.inspectionNumber}`}
        actions={(
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.8rem', background: '#fff' }}
            >
              {formatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button type="button" className="btn btn-secondary" onClick={handleExport}>
              <i className="fa fa-download" aria-hidden="true" /> Report
            </button>
            {editable && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
              >
                <i className={`fa ${mode === 'edit' ? 'fa-eye' : 'fa-pen'}`} aria-hidden="true" />
                {mode === 'edit' ? 'View' : 'Edit'}
              </button>
            )}
          </div>
        )}
      >
        <div className="inspection-detail-meta">
          <StatusBadge status={item.status} />
          <span>Date: {toDateInputValue(item.inspectionDate)}</span>
          <span>Inspector: {item.inspector?.name || '—'}</span>
          {compliance && <span>Compliance: {compliance.complianceRate}%</span>}
        </div>

        {banner && (
          <div
            className={banner.type === 'error' ? 'inspection-form-error' : 'inspection-form-success'}
            role={banner.type === 'error' ? 'alert' : 'status'}
          >
            <i className={`fa ${banner.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />{' '}
            {banner.message}
          </div>
        )}

        <div className="inspection-tabs" role="tablist" aria-label="Inspection views">
          {['form', 'comments', 'audit'].map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              id={`tab-${entry}`}
              aria-selected={tab === entry}
              aria-controls={`panel-${entry}`}
              className={`inspection-tab ${tab === entry ? 'active' : ''}`}
              onClick={() => {
                setTab(entry);
                if (entry === 'audit' && !audit) loadAudit();
              }}
            >
              {entry === 'form' ? 'Inspection Form' : entry === 'comments' ? 'Review Comments' : 'Audit Trail'}
            </button>
          ))}
        </div>

        <div id="panel-form" role="tabpanel" aria-labelledby="tab-form" hidden={tab !== 'form'}>
          {mode === 'edit' && (
            <StepIndicator
              steps={steps}
              currentIndex={stepIndex}
              furthestIndex={furthestStep}
              onSelect={goToStep}
            />
          )}

          <div className="inspection-form-wrapper">
            {mode === 'view' ? (
              <ReviewStep
                inspectionNumber={item.inspectionNumber}
                inspectionDate={item.inspectionDate}
                formData={formData}
                findingSections={findingSections}
                findingStatuses={findingStatuses}
                productGroups={PRODUCT_GROUPS}
                outletTypeLabels={outletTypes}
                outletRecordName={item.outlet?.outletName || ''}
              />
            ) : (
              <>
                {step === 'inspection' && (
                  <InspectionInfoStep
                    inspectionNumber={item.inspectionNumber}
                    inspectionDate={inspectionDate}
                    formData={formData}
                    errors={errors}
                    onDateChange={(field, value) => {
                      if (field === 'date') setInspectionDate(value);
                      if (field === 'formNumber') setFormNumber(value);
                    }}
                  />
                )}
                {step === 'outlet' && (
                  <OutletDetailsStep
                    formData={formData}
                    errors={errors}
                    outlets={outlets}
                    selectedOutletId={outletId}
                    onSelectOutlet={handleSelectOutlet}
                    onOutletCreated={handleOutletCreated}
                    onChange={updateOutletField}
                    outletTypes={outletTypes}
                  />
                )}
                {step === 'owner' && (
                  <OwnerDetailsStep
                    formData={formData}
                    errors={errors}
                    onChange={updateOwnerField}
                    onKvbChange={updateOwnerKvbStatus}
                  />
                )}
                {step === 'attendants' && (
                  <AttendantsStep
                    formData={formData}
                    errors={errors}
                    onChange={updateAttendant}
                    onKvbChange={updateAttendantKvbStatus}
                    onAdd={addAttendant}
                    onRemove={removeAttendant}
                    maxAttendants={maxAttendants}
                  />
                )}
                {step === 'products' && (
                  <ProductsStep
                    formData={formData}
                    errors={errors}
                    productGroups={PRODUCT_GROUPS}
                    onToggle={toggleProduct}
                    onOtherDescription={setOtherProductsDescription}
                  />
                )}
                {step === 'findings' && (
                  <FindingsStep
                    formData={formData}
                    errors={errors}
                    findingSections={findingSections}
                    findingStatuses={findingStatuses}
                    onChange={setFinding}
                    onOtherComments={setOtherComments}
                  />
                )}
                {step === 'signoff' && (
                  <SignOffStep formData={formData} errors={errors} onChange={setSignOff} />
                )}
                {step === 'review' && (
                  <ReviewStep
                    inspectionNumber={item.inspectionNumber}
                    inspectionDate={inspectionDate}
                    formData={formData}
                    findingSections={findingSections}
                    findingStatuses={findingStatuses}
                    productGroups={PRODUCT_GROUPS}
                    outletTypeLabels={outletTypes}
                    outletRecordName={item.outlet?.outletName || ''}
                    updateOutletField={updateOutletField}
                    updateOwnerField={updateOwnerField}
                    updateOwnerKvbStatus={updateOwnerKvbStatus}
                    updateAttendant={updateAttendant}
                    updateAttendantKvbStatus={updateAttendantKvbStatus}
                    toggleProduct={toggleProduct}
                    setFinding={setFinding}
                    setOtherComments={setOtherComments}
                    setSignOff={setSignOff}
                    setLocationField={form.setLocationField}
                    setInspectionDate={setInspectionDate}
                    setFormNumber={setFormNumber}
                  />
                )}
              </>
            )}
          </div>

          {mode === 'edit' && (
            <div className="inspection-form-actions">
              <button type="button" className="btn btn-outline" onClick={previousStep} disabled={stepIndex === 0}>
                <i className="fa fa-arrow-left" aria-hidden="true" /> Back
              </button>
              <div className="inspection-form-actions-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
                </button>
                {stepIndex < STEPS.length - 1 ? (
                  <button type="button" className="btn btn-primary" onClick={handleContinue}>
                    Continue <i className="fa fa-arrow-right" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Submitting…' : 'Submit Inspection'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div id="panel-comments" role="tabpanel" aria-labelledby="tab-comments" hidden={tab !== 'comments'}>
          <div className="inspection-form-section">
            <h2 className="inspection-section-title">Review Comments</h2>
            {(record.comments || []).length === 0 && <p className="inspection-field-hint">No comments recorded yet.</p>}
            {(record.comments || []).map((comment) => (
              <article className="inspection-comment" key={comment._id}>
                <p className="inspection-comment-meta">
                  <strong>{comment.author?.name || 'User'}</strong> ({comment.role}) &middot;{' '}
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
                <p className="inspection-comment-body">{comment.commentText}</p>
              </article>
            ))}
          </div>
        </div>

        <div id="panel-audit" role="tabpanel" aria-labelledby="tab-audit" hidden={tab !== 'audit'}>
          <div className="inspection-form-section">
            <h2 className="inspection-section-title">Audit Trail</h2>
            {!audit && <p className="inspection-field-hint">Loading audit entries…</p>}
            {audit && audit.items.length === 0 && <p className="inspection-field-hint">No audit entries recorded.</p>}
            {audit && audit.items.map((entry) => (
              <article className="inspection-audit-entry" key={entry._id}>
                <p className="inspection-audit-meta">
                  <strong>{entry.action.replace(/_/g, ' ')}</strong> &middot; {entry.user?.name || 'System'} &middot;{' '}
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.ipAddress ? ` · ${entry.ipAddress}` : ''}
                </p>
                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <ul className="inspection-audit-changes">
                    {Object.entries(entry.changes).slice(0, 8).map(([field, change]) => (
                      <li key={field}>
                        <code>{field}</code>: {String(change.from ?? '—')} &rarr; {String(change.to ?? '—')}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </InspectionFormShell>
    </ProtectedRoute>
  );
}
