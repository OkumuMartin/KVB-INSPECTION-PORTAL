'use client';

import { Checkbox, FormField, FormSection } from './FormField';
import { LIMITS } from '../../lib/inspectionForm';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

export default function OwnerDetailsStep({ formData, errors, onChange, onKvbChange, readOnly }) {
  const { ownerInformation, kvbStatus } = formData;

  return (
    <FormSection number="3" title="Owner Details" description="4(i) Owner information as recorded on the KVB form.">
      <div className="inspection-form-grid">
        <FormField id="ownerName" label="Owner's Name" required error={errors['formData.ownerInformation.ownerName']}>
          <input
            id="ownerName"
            type="text"
            value={ownerInformation.ownerName}
            onChange={(event) => onChange('ownerName', event.target.value)}
            disabled={readOnly}
            maxLength={LIMITS.nameMax}
            required
            aria-invalid={Boolean(errors['formData.ownerInformation.ownerName'])}
          />
        </FormField>

        <FormField id="ownerTelephone" label="Tel. No." error={errors['formData.ownerInformation.telephone']}>
          <input
            id="ownerTelephone"
            type="tel"
            inputMode="tel"
            value={ownerInformation.telephone}
            onChange={(event) => onChange('telephone', event.target.value)}
            disabled={readOnly}
            placeholder="+254712345678"
            aria-invalid={Boolean(errors['formData.ownerInformation.telephone'])}
          />
        </FormField>

        <FormField id="ownerEmail" label="Email Address" hint="Optional. Used for correspondence only.">
          <input
            id="ownerEmail"
            type="email"
            value={ownerInformation.ownerEmail}
            onChange={(event) => onChange('ownerEmail', event.target.value)}
            disabled={readOnly}
            maxLength={120}
          />
        </FormField>

        <FormField id="trainingLevel" label="Level of Training in Animal Health" full>
          <input
            id="trainingLevel"
            type="text"
            value={ownerInformation.trainingLevel}
            onChange={(event) => onChange('trainingLevel', event.target.value)}
            disabled={readOnly}
            maxLength={LIMITS.trainingLevelMax}
            placeholder="e.g. Certificate in Animal Health"
          />
        </FormField>

        <FormField id="ownerAddress" label="Address" full>
          <textarea
            id="ownerAddress"
            rows={2}
            value={ownerInformation.address}
            onChange={(event) => onChange('address', event.target.value)}
            disabled={readOnly}
            maxLength={LIMITS.addressMax}
          />
        </FormField>
      </div>

      <h3 className="inspection-subheading">KVB Status</h3>
      <div className="inspection-form-grid">
        <FormField id="ownerRegistrationNumber" label="Reg. No.">
          <input
            id="ownerRegistrationNumber"
            type="text"
            value={kvbStatus.registrationNumber}
            onChange={(event) => onKvbChange('registrationNumber', event.target.value)}
            disabled={readOnly}
            maxLength={LIMITS.registrationNumberMax}
          />
        </FormField>

        <fieldset className="inspection-fieldset">
          <legend className="inspection-field-label">Status</legend>
          <div className="inspection-kvb-year-row">
            <Checkbox
              id="ownerRetention"
              label="Retention"
              checked={kvbStatus.retention}
              onChange={(value) => onKvbChange('retention', value)}
              disabled={readOnly}
            />
            {kvbStatus.retention && (
              <select
                id="ownerRetentionYear"
                value={kvbStatus.retentionYear}
                onChange={(event) => onKvbChange('retentionYear', event.target.value)}
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
              id="ownerPractice"
              label="Practice"
              checked={kvbStatus.practice}
              onChange={(value) => onKvbChange('practice', value)}
              disabled={readOnly}
            />
            {kvbStatus.practice && (
              <select
                id="ownerPracticeYear"
                value={kvbStatus.practiceYear}
                onChange={(event) => onKvbChange('practiceYear', event.target.value)}
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
    </FormSection>
  );
}
