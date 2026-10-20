'use client';

import { useState } from 'react';
import { FormField, FormSection, Checkbox } from './FormField';
import { getFinding, summarizeFindings, formatDisplayDate, toDateInputValue, findStatusOptions, OUTLET_TYPE_OPTIONS, FALLBACK_TRAINING_LEVELS, trainingLevelOptions } from '../../lib/inspectionForm';

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className="review-value">{value || '—'}</span>
    </div>
  );
}

function ReviewBlock({ title, children }) {
  return (
    <section className="review-block">
      <h3 className="inspection-subheading">{title}</h3>
      <div className="review-grid">{children}</div>
    </section>
  );
}

function productLabels(products, productGroups) {
  const selected = [];

  for (const group of productGroups) {
    for (const item of group.items) {
      if (products[group.key]?.[item.key]) selected.push(item.label);
    }
  }

  if (products.otherProducts?.others && products.otherProducts.otherDescription) {
    selected.push(`Others: ${products.otherProducts.otherDescription}`);
  }

  return selected.length > 0 ? selected.join(', ') : 'None recorded';
}

export default function ReviewStep({
    inspectionNumber,
    inspectionDate,
    formData,
    findingSections,
    productGroups,
    outletTypeLabels,
    outletRecordName,
    trainingLevels = FALLBACK_TRAINING_LEVELS,
  // Edit handlers
  updateOutletField,
  updateOwnerField,
  updateOwnerKvbStatus,
  updateAttendant,
  updateAttendantKvbStatus,
  toggleProduct,
  setFinding,
  setOtherComments,
  setSignOff,
  setLocationField,
  setInspectionDate,
  setFormNumber,
  readOnly = false,
}) {
  const [editing, setEditing] = useState(false);
  const summary = summarizeFindings(formData, findingSections);
  const { outletInformation, ownerInformation, kvbStatus, attendants, products, signOff, location } = formData;

  const outletType = outletTypeLabels.find((entry) => entry.value === outletInformation.outletType)?.label
    || outletInformation.outletType
    || '—';

  if (editing) {
    return (
      <FormSection number="8" title="Review Inspection — Edit Mode" description="Correct data entry errors directly from the review screen.">
        <div className="inspection-form-grid">
          {/* Inspection block */}
          <ReviewBlock title="Inspection">
            <div className="review-row">
              <span className="review-label">Inspection No.</span>
              <span className="review-value">{inspectionNumber || 'Generated on save'}</span>
            </div>
            <FormField id="edit-inspectionDate" label="Inspection Date" required>
              <input
                id="edit-inspectionDate"
                type="date"
                value={toDateInputValue(inspectionDate)}
                onChange={(event) => setInspectionDate(event.target.value)}
                disabled={readOnly}
                required
              />
            </FormField>
            <FormField id="edit-formNumber" label="Form Number">
              <input
                id="edit-formNumber"
                type="text"
                value={formData.inspectionDetails.formNumber}
                onChange={(event) => setFormNumber(event.target.value)}
                disabled={readOnly}
                maxLength={50}
              />
            </FormField>
          </ReviewBlock>

          {/* Outlet block */}
          <ReviewBlock title="Outlet">
            <FormField id="edit-outletName" label="Name of Outlet" required error={formData.outletInformation.outletName ? undefined : 'Required'}>
              <input
                id="edit-outletName"
                type="text"
                value={outletInformation.outletName}
                onChange={(event) => updateOutletField('outletName', event.target.value)}
                disabled={readOnly}
                required
              />
            </FormField>
            <FormField id="edit-outletType" label="Type of Outlet" required>
              <select
                id="edit-outletType"
                value={outletInformation.outletType || ''}
                onChange={(event) => updateOutletField('outletType', event.target.value)}
                disabled={readOnly}
                required
              >
                <option value="">-- Select type --</option>
                {OUTLET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
            {outletInformation.outletType === 'OTHER' && (
              <FormField id="edit-otherType" label="Specify Other Outlet Type" required>
                <input
                  id="edit-otherType"
                  type="text"
                  value={outletInformation.otherType}
                  onChange={(event) => updateOutletField('otherType', event.target.value)}
                  disabled={readOnly}
                  required
                />
              </FormField>
            )}
            <FormField id="edit-county" label="County" required>
              <select
                id="edit-county"
                value={outletInformation.county || ''}
                onChange={(event) => updateOutletField('county', event.target.value)}
                disabled={readOnly}
                required
              >
                <option value="">-- Select county --</option>
              </select>
            </FormField>
            <FormField id="edit-subCounty" label="Sub-County" required>
              <select
                id="edit-subCounty"
                value={outletInformation.subCounty || ''}
                onChange={(event) => updateOutletField('subCounty', event.target.value)}
                disabled={readOnly}
                required
              >
                <option value="">-- Select sub-county --</option>
              </select>
            </FormField>
            <FormField id="edit-centre" label="Centre">
              <input
                id="edit-centre"
                type="text"
                value={outletInformation.centre}
                onChange={(event) => updateOutletField('centre', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
            <FormField id="edit-latitude" label="Latitude">
              <input
                id="edit-latitude"
                type="text"
                value={location.latitude}
                onChange={(event) => setLocationField('latitude', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
            <FormField id="edit-longitude" label="Longitude">
              <input
                id="edit-longitude"
                type="text"
                value={location.longitude}
                onChange={(event) => setLocationField('longitude', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
          </ReviewBlock>

          {/* Owner block */}
          <ReviewBlock title="Owner">
            <FormField id="edit-ownerName" label="Owner's Name" required>
              <input
                id="edit-ownerName"
                type="text"
                value={ownerInformation.ownerName}
                onChange={(event) => updateOwnerField('ownerName', event.target.value)}
                disabled={readOnly}
                required
              />
            </FormField>
            <FormField id="edit-ownerTelephone" label="Tel. No.">
              <input
                id="edit-ownerTelephone"
                type="tel"
                inputMode="tel"
                value={ownerInformation.telephone}
                onChange={(event) => updateOwnerField('telephone', event.target.value)}
                disabled={readOnly}
                placeholder="+254712345678"
              />
            </FormField>
            <FormField id="edit-ownerEmail" label="Email Address">
              <input
                id="edit-ownerEmail"
                type="email"
                value={ownerInformation.ownerEmail}
                onChange={(event) => updateOwnerField('ownerEmail', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
            <FormField id="edit-trainingLevel" label="Level of Training in Animal Health">
              <select
                id="edit-trainingLevel"
                value={ownerInformation.trainingLevel}
                onChange={(event) => updateOwnerField('trainingLevel', event.target.value)}
                disabled={readOnly}
                className="inspection-select"
              >
                <option value="">Select level of training</option>
                {trainingLevelOptions(trainingLevels, ownerInformation.trainingLevel).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </FormField>
            <FormField id="edit-ownerAddress" label="Address">
              <textarea
                id="edit-ownerAddress"
                rows={2}
                value={ownerInformation.address}
                onChange={(event) => updateOwnerField('address', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
            <FormField id="edit-regNumber" label="Reg. No.">
              <input
                id="edit-regNumber"
                type="text"
                value={kvbStatus.registrationNumber}
                onChange={(event) => updateOwnerKvbStatus('registrationNumber', event.target.value)}
                disabled={readOnly}
              />
            </FormField>
            <fieldset className="inspection-fieldset">
              <legend className="inspection-field-label">KVB Status</legend>
              <div className="inspection-kvb-year-row">
                <Checkbox
                  id="edit-ownerRetention"
                  label="Retention"
                  checked={kvbStatus.retention}
                  onChange={(value) => updateOwnerKvbStatus('retention', value)}
                  disabled={readOnly}
                />
                {kvbStatus.retention && (
                  <select
                    id="edit-ownerRetentionYear"
                    value={kvbStatus.retentionYear || ''}
                    onChange={(event) => updateOwnerKvbStatus('retentionYear', event.target.value)}
                    disabled={readOnly}
                    className="inspection-year-select"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="inspection-kvb-year-row">
                <Checkbox
                  id="edit-ownerPractice"
                  label="Practice"
                  checked={kvbStatus.practice}
                  onChange={(value) => updateOwnerKvbStatus('practice', value)}
                  disabled={readOnly}
                />
                {kvbStatus.practice && (
                  <select
                    id="edit-ownerPracticeYear"
                    value={kvbStatus.practiceYear || ''}
                    onChange={(event) => updateOwnerKvbStatus('practiceYear', event.target.value)}
                    disabled={readOnly}
                    className="inspection-year-select"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                )}
              </div>
            </fieldset>
          </ReviewBlock>

          {/* Attendants block */}
          <ReviewBlock title="Attendants">
            {attendants.map((attendant, index) => (
              <fieldset className="inspection-attendant-card" key={index}>
                <legend className="inspection-attendant-legend">Attendant {index + 1}</legend>
                <div className="inspection-form-grid">
                  <FormField id={`edit-attendantName-${index}`} label="Name">
                    <input
                      id={`edit-attendantName-${index}`}
                      type="text"
                      value={attendant.name}
                      onChange={(event) => updateAttendant(index, 'name', event.target.value)}
                      disabled={readOnly}
                    />
                  </FormField>
                  <FormField id={`edit-attendantPhone-${index}`} label="Tel. No.">
                    <input
                      id={`edit-attendantPhone-${index}`}
                      type="tel"
                      inputMode="tel"
                      value={attendant.telephone}
                      onChange={(event) => updateAttendant(index, 'telephone', event.target.value)}
                      disabled={readOnly}
                      placeholder="+254712345678"
                    />
                  </FormField>
                  <FormField id={`edit-attendantReg-${index}`} label="Reg. No.">
                    <input
                      id={`edit-attendantReg-${index}`}
                      type="text"
                      value={attendant.kvbStatus.registrationNumber}
                      onChange={(event) => updateAttendantKvbStatus(index, 'registrationNumber', event.target.value)}
                      disabled={readOnly}
                    />
                  </FormField>
                </div>
                <fieldset className="inspection-fieldset">
                  <legend className="inspection-field-label">KVB Status</legend>
                  <div className="inspection-kvb-year-row">
                    <Checkbox
                      id={`edit-attendantRetention-${index}`}
                      label="Retention"
                      checked={attendant.kvbStatus.retention}
                      onChange={(value) => updateAttendantKvbStatus(index, 'retention', value)}
                      disabled={readOnly}
                    />
                    {attendant.kvbStatus.retention && (
                      <select
                        id={`edit-attendantRetentionYear-${index}`}
                        value={attendant.kvbStatus.retentionYear || ''}
                        onChange={(event) => updateAttendantKvbStatus(index, 'retentionYear', event.target.value)}
                        disabled={readOnly}
                        className="inspection-year-select"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={String(year)}>{year}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="inspection-kvb-year-row">
                    <Checkbox
                      id={`edit-attendantPractice-${index}`}
                      label="Practice"
                      checked={attendant.kvbStatus.practice}
                      onChange={(value) => updateAttendantKvbStatus(index, 'practice', value)}
                      disabled={readOnly}
                    />
                    {attendant.kvbStatus.practice && (
                      <select
                        id={`edit-attendantPracticeYear-${index}`}
                        value={attendant.kvbStatus.practiceYear || ''}
                        onChange={(event) => updateAttendantKvbStatus(index, 'practiceYear', event.target.value)}
                        disabled={readOnly}
                        className="inspection-year-select"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={String(year)}>{year}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </fieldset>
              </fieldset>
            ))}
          </ReviewBlock>

          {/* Products block */}
          <ReviewBlock title="Products Stocked">
            <div className="inspection-checkbox-grid">
              {productGroups.map((group) => (
                <div key={group.key} className="inspection-product-group">
                  <h4 className="inspection-subheading">{group.title}</h4>
                  {group.items.map((item) => {
                    const id = `edit-product-${group.key}-${item.key}`;
                    return (
                      <Checkbox
                        key={item.key}
                        id={id}
                        label={item.label}
                        checked={Boolean(products[group.key]?.[item.key])}
                        onChange={(checked) => toggleProduct(group.key, item.key, checked)}
                        disabled={readOnly}
                      />
                    );
                  })}
                </div>
              ))}
              {products.otherProducts?.others && (
                <FormField id="edit-otherProductsDescription" label="Specify Other Products">
                  <input
                    id="edit-otherProductsDescription"
                    type="text"
                    value={products.otherProducts.otherDescription}
                    onChange={(event) => setOtherComments(event.target.value)}
                    disabled={readOnly}
                  />
                </FormField>
              )}
            </div>
          </ReviewBlock>

          {/* Findings block */}
          <ReviewBlock title="Inspection Findings">
            <p className="inspection-summary" role="status">
              {summary.assessed} of {summary.total} areas assessed &middot; {summary.compliant} compliant &middot;{' '}
              {summary.nonCompliant} non-compliant &middot; {summary.notAssessed} not assessed
            </p>
            {findingSections.map((section) => (
              <div className="review-findings" key={section.key}>
                <h4 className="review-findings-title">{section.number} {section.title}</h4>
                <table className="review-table">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item) => {
                      const finding = getFinding(formData, section.key, item.key);
                      const statusOptions = findStatusOptions(section.key, item.key);
                      return (
                        <tr key={item.key}>
                          <th scope="row">{item.label}</th>
                          <td>
                            <select
                              id={`edit-finding-${section.key}-${item.key}`}
                              value={finding.status}
                              onChange={(event) => setFinding(section.key, item.key, 'status', event.target.value)}
                              disabled={readOnly}
                              className="inspection-finding-select"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </ReviewBlock>

          {/* Remarks block */}
          <ReviewBlock title="Inspector Remarks">
            <FormField id="edit-otherComments" label="Remarks" full>
              <textarea
                id="edit-otherComments"
                rows={4}
                value={formData.otherComments}
                onChange={(event) => setOtherComments(event.target.value)}
                disabled={readOnly}
                placeholder="Record all observations, corrective actions, and agreements reached."
              />
            </FormField>
          </ReviewBlock>

          {/* Sign-Off block */}
          <ReviewBlock title="Sign-Off">
            <fieldset className="inspection-signoff-block">
              <legend className="inspection-signoff-legend">Name of Inspector</legend>
              <div className="inspection-form-grid">
                <FormField id="edit-signoffInspectorName" label="Name" required>
                  <input
                    id="edit-signoffInspectorName"
                    type="text"
                    value={signOff.inspector.name}
                    onChange={(event) => setSignOff('inspector', { name: event.target.value })}
                    disabled={readOnly}
                    required
                  />
                </FormField>
                <FormField id="edit-signoffInspectorDate" label="Date" required>
                  <input
                    id="edit-signoffInspectorDate"
                    type="date"
                    value={toDateInputValue(signOff.inspector.date)}
                    onChange={(event) => setSignOff('inspector', { date: event.target.value })}
                    disabled={readOnly}
                    required
                  />
                </FormField>
              </div>
            </fieldset>
            <fieldset className="inspection-signoff-block">
              <legend className="inspection-signoff-legend">Name of Person Incharge</legend>
              <div className="inspection-form-grid">
                <FormField id="edit-signoffPersonName" label="Name" required>
                  <input
                    id="edit-signoffPersonName"
                    type="text"
                    value={signOff.personInCharge.name}
                    onChange={(event) => setSignOff('personInCharge', { name: event.target.value })}
                    disabled={readOnly}
                    required
                  />
                </FormField>
                <FormField id="edit-signoffPersonDate" label="Date" required>
                  <input
                    id="edit-signoffPersonDate"
                    type="date"
                    value={toDateInputValue(signOff.personInCharge.date)}
                    onChange={(event) => setSignOff('personInCharge', { date: event.target.value })}
                    disabled={readOnly}
                    required
                  />
                </FormField>
              </div>
            </fieldset>
          </ReviewBlock>
        </div>

        <div className="inspection-form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setEditing(false)}
            disabled={readOnly}
          >
            <i className="fa fa-times" aria-hidden="true" /> Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditing(false)}
            disabled={readOnly}
          >
            <i className="fa fa-save" aria-hidden="true" /> Save Changes
          </button>
        </div>
      </FormSection>
    );
  }

  // Read-only view
  return (
    <FormSection number="8" title="Review Inspection" description="Confirm the record before submitting it for review.">
      <ReviewBlock title="Inspection">
        <ReviewRow label="Inspection No." value={inspectionNumber || 'Generated on save'} />
        <ReviewRow label="Inspection Date" value={formatDisplayDate(inspectionDate)} />
        <ReviewRow label="Outlet record" value={outletRecordName} />
        {!readOnly && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setEditing(true)}
            style={{ marginTop: '0.5rem', display: 'block' }}
          >
            <i className="fa fa-pen" aria-hidden="true" /> Edit Review
          </button>
        )}
      </ReviewBlock>

      <ReviewBlock title="Outlet">
        <ReviewRow label="Name of Outlet" value={outletInformation.outletName} />
        <ReviewRow
          label="Type of Outlet"
          value={outletType === 'Others' && outletInformation.otherType ? `Others — ${outletInformation.otherType}` : outletType}
        />
        <ReviewRow label="County" value={outletInformation.county} />
        <ReviewRow label="Sub-County" value={outletInformation.subCounty} />
        <ReviewRow label="Centre" value={outletInformation.centre} />
        <ReviewRow label="Latitude" value={location.latitude} />
        <ReviewRow label="Longitude" value={location.longitude} />
      </ReviewBlock>

      <ReviewBlock title="Owner">
        <ReviewRow label="Owner's Name" value={ownerInformation.ownerName} />
        <ReviewRow label="Tel. No." value={ownerInformation.telephone} />
        <ReviewRow label="Address" value={ownerInformation.address} />
        <ReviewRow label="Level of Training" value={ownerInformation.trainingLevel} />
        <ReviewRow label="Reg. No." value={kvbStatus.registrationNumber} />
        <ReviewRow
          label="Retention"
          value={`${kvbStatus.retention ? 'Yes' : 'No'}${kvbStatus.retentionYear ? ' (' + kvbStatus.retentionYear + ')' : ''}`}
        />
        <ReviewRow
          label="Practice"
          value={`${kvbStatus.practice ? 'Yes' : 'No'}${kvbStatus.practiceYear ? ' (' + kvbStatus.practiceYear + ')' : ''}`}
        />
      </ReviewBlock>

      <ReviewBlock title="Attendants">
        {attendants.filter((attendant) => attendant.name || attendant.telephone).length === 0 && (
          <p className="review-empty">No attendants recorded.</p>
        )}
        {attendants.map((attendant, index) => (
          <div className="review-attendant" key={index}>
            <p className="review-attendant-name">
              {index + 1}. {attendant.name || 'Unnamed attendant'}
            </p>
            <p className="review-attendant-meta">
              {attendant.telephone || 'No telephone'} &middot; Reg. No. {attendant.kvbStatus.registrationNumber || 'N/A'} &middot;{' '}
              {attendant.kvbStatus.retention ? `Retention${attendant.kvbStatus.retentionYear ? ' (' + attendant.kvbStatus.retentionYear + ')' : ''}` : 'No retention'} &middot;{' '}
              {attendant.kvbStatus.practice ? `Practice${attendant.kvbStatus.practiceYear ? ' (' + attendant.kvbStatus.practiceYear + ')' : ''}` : 'No practice'}
            </p>
          </div>
        ))}
      </ReviewBlock>

      <ReviewBlock title="Products Stocked">
        <ReviewRow label="Products" value={productLabels(products, productGroups)} />
      </ReviewBlock>

      <ReviewBlock title="Inspection Findings">
        <p className="inspection-summary" role="status">
          {summary.assessed} of {summary.total} areas assessed &middot; {summary.compliant} compliant &middot;{' '}
          {summary.nonCompliant} non-compliant &middot; {summary.notAssessed} not assessed
        </p>

        {findingSections.map((section) => (
          <div className="review-findings" key={section.key}>
            <h4 className="review-findings-title">
              {section.number} {section.title}
            </h4>
            <table className="review-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  const finding = getFinding(formData, section.key, item.key);
                  return (
                    <tr key={item.key}>
                      <th scope="row">{item.label}</th>
                      <td>
                        <span className="finding-pill">
                          {finding.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </ReviewBlock>

      <ReviewBlock title="Inspector Remarks">
        <p className="review-comments">{formData.otherComments || 'No additional comments recorded.'}</p>
      </ReviewBlock>

      <ReviewBlock title="Sign-Off">
        <ReviewRow label="Name of Inspector" value={signOff.inspector.name} />
        <ReviewRow label="Inspector Date" value={formatDisplayDate(signOff.inspector.date)} />
        <ReviewRow label="Inspector Signature" value={signOff.inspector.signatureData ? 'Captured' : 'Not captured'} />
        <ReviewRow label="Name of Person Incharge" value={signOff.personInCharge.name} />
        <ReviewRow label="Person Incharge Date" value={formatDisplayDate(toDateInputValue(signOff.personInCharge.date))} />
        <ReviewRow
          label="Person Incharge Signature"
          value={signOff.personInCharge.signatureData ? 'Captured' : 'Not captured'}
        />
      </ReviewBlock>
    </FormSection>
  );
}
