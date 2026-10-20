'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createEmptyFormData,
  mergeFormData,
  STEPS,
  validateFieldPath,
} from '../lib/inspectionForm';

const emptyAttendant = () => ({
  name: '',
  telephone: '',
  kvbStatus: { registrationNumber: '', retention: false, practice: false, retentionYear: '', practiceYear: '' },
});

export function useInspectionForm({ initialFormData, initialOutletId = '', initialDate = '', inspectorName = '' }) {
  const [formData, setFormData] = useState(() => initialFormData || createEmptyFormData({ inspectorName, inspectionDate: initialDate }));
  const [outletId, setOutletId] = useState(initialOutletId);
  const [inspectionDate, setInspectionDate] = useState(initialDate);
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [errors, setErrors] = useState({});
  const pendingFurthestRef = useRef(null);

  // Sync pending furthestStep updates after setCurrentStep commits.
  // This avoids calling a state setter inside another state setter's updater.
  useEffect(() => {
    if (pendingFurthestRef.current !== null) {
      setFurthestStep((f) => Math.max(f, pendingFurthestRef.current));
      pendingFurthestRef.current = null;
    }
  }, [currentStep]);

  const step = STEPS[currentStep].id;

  /**
   * Re-check every field that currently shows an error whenever the form
   * data changes.
   *
   * An error is removed the instant the value becomes valid and re-added the
   * moment it becomes invalid again. Only fields that already have an error
   * are re-checked, so a field the user has not visited yet is never flagged.
   */
  useEffect(() => {
    setErrors((prev) => {
      const paths = Object.keys(prev);
      if (paths.length === 0) return prev;

      let changed = false;
      const next = { ...prev };
      for (const path of paths) {
        const message = validateFieldPath(path, formData, { outletId, inspectionDate });
        if (message) {
          if (next[path] !== message) {
            next[path] = message;
            changed = true;
          }
        } else {
          delete next[path];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [formData, outletId, inspectionDate]);

  const updateOutletField = useCallback((field, value) => {
    setFormData((prev) => {
      const outletInformation = { ...prev.outletInformation, [field]: value };
      if (field === 'county') outletInformation.subCounty = '';
      return { ...prev, outletInformation };
    });
  }, []);

  const updateOwnerField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, ownerInformation: { ...prev.ownerInformation, [field]: value } }));
  }, []);

  const updateOwnerKvbStatus = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, kvbStatus: { ...prev.kvbStatus, [field]: value } }));
  }, []);

  const updateAttendant = useCallback((index, field, value) => {
    setFormData((prev) => {
      const attendants = [...prev.attendants];
      if (!attendants[index]) {
        attendants.push(...Array(index + 1 - attendants.length).fill(null).map(emptyAttendant));
      }
      attendants[index] = { ...attendants[index], [field]: value };
      return { ...prev, attendants };
    });
  }, []);

  const updateAttendantKvbStatus = useCallback((index, field, value) => {
    setFormData((prev) => {
      const attendants = [...prev.attendants];
      if (!attendants[index]) {
        attendants.push(...Array(index + 1 - attendants.length).fill(null).map(emptyAttendant));
      }
      attendants[index] = {
        ...attendants[index],
        kvbStatus: { ...attendants[index].kvbStatus, [field]: value },
      };
      return { ...prev, attendants };
    });
  }, []);

  const removeAttendant = useCallback((index) => {
    setFormData((prev) => ({ ...prev, attendants: prev.attendants.filter((_, i) => i !== index) }));
  }, []);

  const addAttendant = useCallback(() => {
    setFormData((prev) => ({ ...prev, attendants: [...prev.attendants, emptyAttendant()] }));
  }, []);

  const toggleProduct = useCallback((groupKey, productKey, checked) => {
    setFormData((prev) => {
      const group = prev.products[groupKey] || {};
      const next = {
        ...prev,
        products: {
          ...prev.products,
          [groupKey]: {
            ...group,
            [productKey]: checked,
          },
        },
      };
      return next;
    });
  }, []);

  const setFinding = useCallback((sectionKey, itemKey, field, value) => {
    setFormData((prev) => {
      const section = prev.findings[sectionKey] || {};
      const item = section[itemKey] || {};
      const next = {
        ...prev,
        findings: {
          ...prev.findings,
          [sectionKey]: {
            ...section,
            [itemKey]: { ...item, [field]: value },
          },
        },
      };
      return next;
    });
  }, []);

  const setOtherComments = useCallback((value) => {
    setFormData((prev) => ({ ...prev, otherComments: value }));
  }, []);

  const setSignOff = useCallback((party, patch) => {
    setFormData((prev) => ({
      ...prev,
      signOff: { ...prev.signOff, [party]: { ...prev.signOff[party], ...patch } },
    }));
  }, []);

  const setLocationField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));
  }, []);

  const setFormNumber = useCallback((value) => {
    setFormData((prev) => ({ ...prev, inspectionDetails: { ...prev.inspectionDetails, formNumber: value } }));
  }, []);

  const goToStep = useCallback((index) => {
    setErrors({});
    setCurrentStep(Math.min(Math.max(index, 0), STEPS.length - 1));
  }, []);

  const nextStep = useCallback(() => {
    setErrors({});
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, STEPS.length - 1);
      pendingFurthestRef.current = next;
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const hydrate = useCallback((draft) => {
    if (!draft) return;
    if (draft.outletId) setOutletId(draft.outletId);
    if (draft.inspectionDate) setInspectionDate(draft.inspectionDate);
    if (draft.formData) setFormData(mergeFormData(draft.formData, { inspectorName }));
    if (typeof draft.stepIndex === 'number') {
      const target = Math.min(Math.max(draft.stepIndex, 0), STEPS.length - 1);
      setFurthestStep((f) => Math.max(f, target));
      setCurrentStep(target);
    }
  }, [inspectorName]);

  const resetForm = useCallback(() => {
    setFormData(createEmptyFormData({ inspectorName, inspectionDate: initialDate }));
    setOutletId(initialOutletId);
    setInspectionDate(initialDate);
    setCurrentStep(0);
    setFurthestStep(0);
    setErrors({});
  }, [initialDate, initialOutletId, inspectorName]);

  return {
    formData,
    setFormData,
    outletId,
    setOutletId,
    inspectionDate,
    setInspectionDate,
    currentStep,
    setCurrentStep,
    furthestStep,
    setFurthestStep,
    errors,
    setErrors,
    step,
    stepIndex: currentStep,
    currentStep,
    steps: STEPS,
    STEPS,
    updateOutletField,
    updateOwnerField,
    updateOwnerKvbStatus,
    updateAttendant,
    updateAttendantKvbStatus,
    removeAttendant,
    addAttendant,
    toggleProduct,
    setFinding,
    setOtherComments,
    setSignOff,
    setLocationField,
    setFormNumber,
    goToStep,
    nextStep,
    prevStep,
    previousStep: prevStep,
    hydrate,
    resetForm,
  };
}