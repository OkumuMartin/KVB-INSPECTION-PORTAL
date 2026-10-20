'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { useInspectionForm } from '../../../hooks/useInspectionForm';
import { useInspectionFormSchema } from '../../../hooks/useInspectionFormSchema';
import { extractError, useSaveInspection, useSubmitInspection } from '../../../hooks/useInspectionActions';
import { clearLocalDraft, readLocalDraft, saveLocalDraft } from '../../../lib/draftStorage';
import {
  collectStepErrors,
  PRODUCT_GROUPS,
  toDateInputValue,
} from '../../../lib/inspectionForm';
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
import '../../../styles/InspectionForm.css';

export default function NewInspectionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [outlets, setOutlets] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [banner, setBanner] = useState(null);
  const [inspectionId, setInspectionId] = useState(null);
  const [inspectionNumber, setInspectionNumber] = useState('');
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const hydratedRef = useRef(false);
  const draftTimerRef = useRef(null);

  const { findingSections, outletTypes, maxAttendants, trainingLevels } = useInspectionFormSchema();
  const saveMutation = useSaveInspection();
  const submitMutation = useSubmitInspection();

  const today = toDateInputValue(new Date());

  const form = useInspectionForm({
    inspectorName: user?.name || '',
    initialDate: today,
  });

  const {
    formData, outletId, inspectionDate, step, stepIndex, furthestStep, steps, errors,
    setOutletId, setInspectionDate, setErrors, setFurthestStep, hydrate,
    updateOutletField, updateOwnerField, updateOwnerKvbStatus, updateAttendant,
    updateAttendantKvbStatus, addAttendant, removeAttendant, toggleProduct,
    setOtherProductsDescription, setFinding, setOtherComments, setSignOff, setFormNumber,
    goToStep, nextStep, previousStep,
  } = form;

  useEffect(() => {
    let cancelled = false;

    api.get('/outlets?limit=100')
      .then((res) => {
        if (cancelled) return;
        setOutlets(res.data.items || res.data || []);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Outlet records could not be loaded. Refresh the page to try again.');
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hydratedRef.current || !user) return;
    hydratedRef.current = true;

    const draft = readLocalDraft(user._id);
    if (draft) {
      hydrate(draft);
      setRecoveredDraft(true);
    }
  }, [user, hydrate]);

  // Debounce the local draft persistence so AES-256-GCM encryption does not
  // fire on every keystroke. 1000 ms is enough to absorb typing bursts while
  // still saving work before a tab close.
  useEffect(() => {
    if (!user) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveLocalDraft(user._id, { outletId, inspectionDate, formData, stepIndex });
    }, 1000);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [user, outletId, inspectionDate, formData, stepIndex]);

  const productGroups = PRODUCT_GROUPS;

  const buildPayload = useCallback(() => ({    outlet: outletId,
    inspectionDate,
    formData,
  }), [outletId, inspectionDate, formData]);

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

  const handleSelectOutlet = useCallback((id) => {
    setOutletId(id);
    const outlet = outlets.find((entry) => entry._id === id);
    if (!outlet) {
      if (id) {
        form.setLocationField('latitude', '');
        form.setLocationField('longitude', '');
      }
      return;
    }

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

    if (outlet.latitude && outlet.longitude) {
      form.setLocationField('latitude', outlet.latitude);
      form.setLocationField('longitude', outlet.longitude);
    }
  }, [outlets, setOutletId, updateOutletField, updateOwnerField, updateOwnerKvbStatus, form]);

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

    if (newOutlet.latitude && newOutlet.longitude) {
      form.setLocationField('latitude', newOutlet.latitude);
      form.setLocationField('longitude', newOutlet.longitude);
    }

    setBanner({
      type: 'success',
      message: `Outlet '${newOutlet.outletName}' created and selected.`,
    });

    setOutlets((prev) => [...prev, newOutlet]);
  }, [setOutletId, updateOutletField, updateOwnerField, updateOwnerKvbStatus, form, setBanner, setOutlets]);

  const handleInspectionInfoChange = useCallback((field, value) => {
    if (field === 'date') setInspectionDate(value);
    if (field === 'formNumber') setFormNumber(value);
  }, [setInspectionDate, setFormNumber]);

  const handleSaveDraft = useCallback(async () => {
    setBanner(null);

    if (!outletId) {
      setBanner({ type: 'error', message: 'Select the outlet being inspected before saving a draft.' });
      return;
    }

    try {
      const result = await saveMutation.mutateAsync({ id: inspectionId, ...buildPayload() });
      const id = result?.item?._id || result?.data?.id || inspectionId;
      setInspectionId(id);
      setInspectionNumber(result?.item?.inspectionNumber || result?.data?.inspectionNumber || inspectionNumber);
      clearLocalDraft(user._id);
      setRecoveredDraft(false);
      setBanner({ type: 'success', message: 'Draft saved to the portal.' });
    } catch (error) {
      const { message, errors: fieldErrors } = extractError(error);
      setBanner({ type: 'error', message, fieldErrors });
    }
  }, [outletId, saveMutation, inspectionId, buildPayload, user, inspectionNumber]);

  const handleSubmit = useCallback(async () => {
    setBanner(null);

    for (const target of steps.map((entry) => entry.id)) {
      if (!validateStep(target)) {
        goToStep(steps.findIndex((entry) => entry.id === target));
        return;
      }
    }

    try {
      let id = inspectionId;

      if (!id) {
        const result = await saveMutation.mutateAsync(buildPayload());
        id = result?.item?._id || result?.data?.id;
        setInspectionId(id);
        setInspectionNumber(result?.item?.inspectionNumber || result?.data?.inspectionNumber || '');
      }

      await submitMutation.mutateAsync(id);
      clearLocalDraft(user._id);
      router.push(`/inspections/${id}`);
    } catch (error) {
      const { message, errors: fieldErrors } = extractError(error);
      setBanner({ type: 'error', message, fieldErrors });

      if (fieldErrors.length > 0) {
        const firstField = fieldErrors[0].field || '';
        const stepId = firstField.split('.')[1] || 'inspection';
        const index = steps.findIndex((entry) => entry.id === stepId);
        if (index >= 0) goToStep(index);
      }
    }
  }, [steps, validateStep, goToStep, inspectionId, saveMutation, submitMutation, buildPayload, router, user]);

  const outletRecordName = useMemo(
    () => outlets.find((entry) => entry._id === outletId)?.outletName || '',
    [outlets, outletId],
  );

  const busy = saveMutation.isPending || submitMutation.isPending;

  const stepContent = () => {
    switch (step) {
      case 'inspection':
        return (
          <InspectionInfoStep
            inspectionNumber={inspectionNumber}
            inspectionDate={inspectionDate}
            formData={formData}
            errors={errors}
            onDateChange={handleInspectionInfoChange}
          />
        );
      case 'outlet':
        return (
          <OutletDetailsStep
            formData={formData}
            errors={errors}
            outlets={outlets}
            selectedOutletId={outletId}
            onSelectOutlet={handleSelectOutlet}
            onOutletCreated={handleOutletCreated}
            onChange={updateOutletField}
            onLocationChange={form.setLocationField}
            outletTypes={outletTypes}
          />
        );
      case 'owner':
        return (
      <OwnerDetailsStep
        formData={formData}
        errors={errors}
        onChange={updateOwnerField}
        onKvbChange={updateOwnerKvbStatus}
        trainingLevels={trainingLevels}
      />
    );
      case 'attendants':
        return (
          <AttendantsStep
            formData={formData}
            errors={errors}
            onChange={updateAttendant}
            onKvbChange={updateAttendantKvbStatus}
            onAdd={addAttendant}
            onRemove={removeAttendant}
            maxAttendants={maxAttendants}
          />
        );
      case 'products':
        return (
          <ProductsStep
            formData={formData}
            errors={errors}
            productGroups={productGroups}
            onToggle={toggleProduct}
            onOtherDescription={setOtherProductsDescription}
          />
        );
      case 'findings':
        return (
          <FindingsStep
            formData={formData}
            errors={errors}
            findingSections={findingSections}
            onChange={setFinding}
            onOtherComments={setOtherComments}
          />
        );
      case 'signoff':
        return <SignOffStep formData={formData} errors={errors} onChange={setSignOff} />;
      case 'review':
        return (
          <ReviewStep
            inspectionNumber={inspectionNumber}
            inspectionDate={inspectionDate}
            formData={formData}
            findingSections={findingSections}
            productGroups={productGroups}
            outletTypeLabels={outletTypes}
            outletRecordName={outletRecordName}
            trainingLevels={trainingLevels}
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
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['INSPECTOR']}>
      <InspectionFormShell breadcrumb="New Inspection" title="New Veterinary Inputs Outlet Inspection">
        <StepIndicator
          steps={steps}
          currentIndex={stepIndex}
          furthestIndex={furthestStep}
          onSelect={goToStep}
        />

        {recoveredDraft && (
          <div className="inspection-notice" role="status">
            <i className="fa fa-cloud-arrow-up" aria-hidden="true" />
            Unsaved answers from this device were restored. Saving the draft to the portal will clear them.
          </div>
        )}

        {loadError && (
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {loadError}
          </div>
        )}

        {banner && (
          <div
            className={banner.type === 'error' ? 'inspection-form-error' : 'inspection-form-success'}
            role={banner.type === 'error' ? 'alert' : 'status'}
          >
            <i className={`fa ${banner.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />{' '}
            {banner.message}
          </div>
        )}

        <div className="inspection-form-wrapper">{stepContent()}</div>

        <div className="inspection-form-actions">
          <button type="button" className="btn btn-outline" onClick={previousStep} disabled={stepIndex === 0 || busy}>
            <i className="fa fa-arrow-left" aria-hidden="true" /> Back
          </button>

          <div className="inspection-form-actions-right">
            <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={busy}>
              {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
            </button>

            {stepIndex < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={busy}>
                Continue <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={busy}>
                {submitMutation.isPending ? 'Submitting…' : 'Submit Inspection'}
              </button>
            )}
          </div>
        </div>
      </InspectionFormShell>
    </ProtectedRoute>
  );
}
