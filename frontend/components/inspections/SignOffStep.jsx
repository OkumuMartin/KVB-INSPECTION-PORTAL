'use client';

import { FormField, FormSection } from './FormField';
import SignaturePad from '../SignaturePad';
import { toDateInputValue } from '../../lib/inspectionForm';

function SignatoryBlock({ id, label, signatory, errors, onChange, readOnly }) {
  const nameError = errors[`formData.signOff.${id}.name`];
  const dateError = errors[`formData.signOff.${id}.date`];

  return (
    <fieldset className="inspection-signoff-block">
      <legend className="inspection-signoff-legend">{label}</legend>

      <div className="inspection-form-grid">
        <FormField id={`${id}-name`} label="Name" required error={nameError}>
          <input
            id={`${id}-name`}
            type="text"
            value={signatory.name}
            onChange={(event) => onChange({ name: event.target.value })}
            disabled={readOnly}
            required
            aria-invalid={Boolean(nameError)}
          />
        </FormField>

        <FormField id={`${id}-date`} label="Date" required error={dateError}>
          <input
            id={`${id}-date`}
            type="date"
            value={toDateInputValue(signatory.date)}
            onChange={(event) => onChange({ date: event.target.value })}
            disabled={readOnly}
            required
            aria-invalid={Boolean(dateError)}
          />
        </FormField>
      </div>

      <SignaturePad
        label="Signature"
        value={signatory.signatureData}
        onChange={(value) => onChange({ signatureData: value })}
        disabled={readOnly}
      />
    </fieldset>
  );
}

export default function SignOffStep({ formData, errors, onChange, readOnly }) {
  return (
    <FormSection
      number="7"
      title="Sign-Off"
      description="Capture the inspector and person in charge signatures."
    >
      <SignatoryBlock
        id="inspector"
        label="Name of Inspector"
        signatory={formData.signOff.inspector}
        errors={errors}
        onChange={(patch) => onChange('inspector', patch)}
        readOnly={readOnly}
      />

      <SignatoryBlock
        id="personInCharge"
        label="Name of Person Incharge"
        signatory={formData.signOff.personInCharge}
        errors={errors}
        onChange={(patch) => onChange('personInCharge', patch)}
        readOnly={readOnly}
      />
    </FormSection>
  );
}
