'use client';

import { FormField, FormSection } from './FormField';
import { getFinding, summarizeFindings, findStatusOptions, LIMITS } from '../../lib/inspectionForm';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v'];

export default function FindingsStep({ formData, errors, findingSections, onChange, onOtherComments, readOnly }) {
  const summary = summarizeFindings(formData, findingSections);
  let globalIndex = 0;

  return (
    <FormSection
      number="6"
      title="Inspection Findings"
      description="Record the observed status for every inspection area."
    >
      <p className="inspection-summary" role="status">
        <strong>{summary.assessed}</strong> of <strong>{summary.total}</strong> areas assessed &middot;{' '}
        <span className="inspection-summary-good">{summary.compliant} compliant</span> &middot;{' '}
        <span className="inspection-summary-bad">{summary.nonCompliant} non-compliant</span> &middot;{' '}
        {summary.notAssessed} not assessed
      </p>

      {findingSections.map((section) => (
        <fieldset className="inspection-findings-group" key={section.key}>
          <legend className="inspection-findings-legend">
            <span className="inspection-findings-number">{section.number}</span>
            {section.title}
          </legend>

          <div className="inspection-form-grid">
            {section.items.map((item) => {
              globalIndex += 1;
              const finding = getFinding(formData, section.key, item.key);
              const errorKey = `formData.findings.${section.key}.${item.key}`;
              const statusOptions = findStatusOptions(section.key, item.key);

              return (
                <div className="inspection-field inspection-field-full inspection-finding" key={item.key}>
                  <label className="inspection-field-label" htmlFor={`${errorKey}-status`}>
                    <span className="inspection-finding-index" aria-hidden="true">
                      ({ROMAN[(globalIndex - 1) % ROMAN.length]})
                    </span>
                    {item.label}
                  </label>

                  <select
                    id={`${errorKey}-status`}
                    value={finding.status}
                    onChange={(event) => onChange(section.key, item.key, 'status', event.target.value)}
                    disabled={readOnly}
                    className={`inspection-finding-select ${finding.status.toLowerCase()}`}
                    aria-invalid={Boolean(errors[errorKey])}
                    aria-describedby={errors[errorKey] ? `${errorKey}-error` : undefined}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {errors[errorKey] && (
                    <p className="inspection-field-error" id={`${errorKey}-error`} role="alert">
                      {errors[errorKey]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <FormField id="findingsRemarks" label="Inspector Remarks" full>
        <textarea
          id="findingsRemarks"
          rows={4}
          value={formData.otherComments}
          onChange={(event) => onOtherComments(event.target.value)}
          disabled={readOnly}
          maxLength={LIMITS.otherCommentsMax}
          placeholder="Record all observations, corrective actions, and agreements reached."
        />
      </FormField>
    </FormSection>
  );
}
