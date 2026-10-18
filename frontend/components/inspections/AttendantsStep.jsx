'use client';

import { Checkbox, FormField, FormSection } from './FormField';
import { LIMITS } from '../../lib/inspectionForm';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

export default function AttendantsStep({ formData, errors, onChange, onKvbChange, onAdd, onRemove, maxAttendants, readOnly }) {
  const { attendants } = formData;

  return (
    <FormSection
      number="4"
      title="Attendant(s)"
      description="4(ii) Record each attendant with their KVB registration status."
    >
      {attendants.map((attendant, index) => {
        const rowError = errors[`formData.attendants.${index}`];

        return (
          <fieldset className="inspection-attendant-card" key={index}>
            <legend className="inspection-attendant-legend">Attendant {index + 1}</legend>

            <div className="inspection-form-grid">
              <FormField
                id={`attendantName-${index}`}
                label="Name"
                error={errors[`formData.attendants.${index}.name`]}
              >
                <input
                  id={`attendantName-${index}`}
                  type="text"
                  value={attendant.name}
                  onChange={(event) => onChange(index, 'name', event.target.value)}
                  disabled={readOnly}
                  maxLength={LIMITS.nameMax}
                  aria-invalid={Boolean(errors[`formData.attendants.${index}.name`])}
                />
              </FormField>

              <FormField
                id={`attendantPhone-${index}`}
                label="Tel. No."
                error={errors[`formData.attendants.${index}.telephone`]}
              >
                <input
                  id={`attendantPhone-${index}`}
                  type="tel"
                  inputMode="tel"
                  value={attendant.telephone}
                  onChange={(event) => onChange(index, 'telephone', event.target.value)}
                  disabled={readOnly}
                  placeholder="+254712345678"
                  aria-invalid={Boolean(errors[`formData.attendants.${index}.telephone`])}
                />
              </FormField>

              <FormField
                id={`attendantReg-${index}`}
                label="Reg. No."
              >
                <input
                  id={`attendantReg-${index}`}
                  type="text"
                  value={attendant.kvbStatus.registrationNumber}
                  onChange={(event) => onKvbChange(index, 'registrationNumber', event.target.value)}
                  disabled={readOnly}
                  maxLength={LIMITS.registrationNumberMax}
                />
              </FormField>

              <fieldset className="inspection-fieldset">
                <legend className="inspection-field-label">KVB Status</legend>
                <div className="inspection-kvb-year-row">
                  <Checkbox
                    id={`attendantRetention-${index}`}
                    label="Retention"
                    checked={attendant.kvbStatus.retention}
                    onChange={(value) => onKvbChange(index, 'retention', value)}
                    disabled={readOnly}
                  />
                  {attendant.kvbStatus.retention && (
                    <select
                      id={`attendantRetentionYear-${index}`}
                      value={attendant.kvbStatus.retentionYear}
                      onChange={(event) => onKvbChange(index, 'retentionYear', event.target.value)}
                      disabled={readOnly}
                      className="inspection-year-select"
                    >
                      <option value="">Year</option>
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="inspection-kvb-year-row">
                  <Checkbox
                    id={`attendantPractice-${index}`}
                    label="Practice"
                    checked={attendant.kvbStatus.practice}
                    onChange={(value) => onKvbChange(index, 'practice', value)}
                    disabled={readOnly}
                  />
                  {attendant.kvbStatus.practice && (
                    <select
                      id={`attendantPracticeYear-${index}`}
                      value={attendant.kvbStatus.practiceYear}
                      onChange={(event) => onKvbChange(index, 'practiceYear', event.target.value)}
                      disabled={readOnly}
                      className="inspection-year-select"
                    >
                      <option value="">Year</option>
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                      ))}
                    </select>
                  )}
                </div>
              </fieldset>
            </div>

            {attendants.length > 1 && !readOnly && (
              <button
                type="button"
                className="btn btn-ghost btn-sm inspection-remove-btn"
                onClick={() => onRemove(index)}
              >
                <i className="fa fa-trash" aria-hidden="true" /> Remove attendant {index + 1}
              </button>
            )}

            {rowError && <p className="inspection-field-error" role="alert">{rowError}</p>}
          </fieldset>
        );
      })}

      {!readOnly && (
        <button
          type="button"
          className="btn btn-secondary inspection-add-btn"
          onClick={onAdd}
          disabled={attendants.length >= maxAttendants}
        >
          <i className="fa fa-plus" aria-hidden="true" /> Add another attendant
        </button>
      )}

      <p className="inspection-field-hint">
        The paper form provides for two attendants. Up to {maxAttendants} may be recorded.
      </p>
    </FormSection>
  );
}
