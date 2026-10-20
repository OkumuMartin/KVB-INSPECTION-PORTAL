'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OUTLET_TYPES, FALLBACK_TRAINING_LEVELS, trainingLevelOptions } from '../../lib/inspectionForm';
import { useRegions } from '../../hooks/useInspectionFormSchema';

const FIELD_LABELS = {
  outletName: 'Outlet Name *',
  outletType: 'Outlet Type *',
  outletTypeOther: 'Other Outlet Type',
  ownerName: 'Owner Name *',
  ownerTrainingLevel: 'Level of Training',
  ownerEmail: 'Owner Email',
  ownerPhone: 'Owner Telephone',
  address: 'Address',
  county: 'County *',
  subCounty: 'Sub-County *',
  centre: 'Centre / Town',
  kvbRegistrationInfo: 'KVB Registration Number',
};

export default function OutletEditForm({ outlet, onCancel, onSubmit, submitting = false }) {
  const { regions } = useRegions();
  const [form, setForm] = useState({
    outletName: '',
    outletType: 'AGROVET',
    outletTypeOther: '',
    ownerName: '',
    ownerTrainingLevel: '',
    ownerEmail: '',
    ownerPhone: '',
    address: '',
    county: '',
    subCounty: '',
    centre: '',
    kvbRegistrationInfo: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (outlet) {
      setForm({
        outletName: outlet.outletName || '',
        outletType: outlet.outletType || 'AGROVET',
        outletTypeOther: outlet.outletTypeOther || '',
        ownerName: outlet.ownerName || '',
        ownerTrainingLevel: outlet.ownerTrainingLevel || '',
        ownerEmail: outlet.ownerEmail || '',
        ownerPhone: outlet.ownerPhone || '',
        address: outlet.address || '',
        county: outlet.county || '',
        subCounty: outlet.subCounty || '',
        centre: outlet.centre || '',
        kvbRegistrationInfo: outlet.kvbRegistrationInfo || '',
      });
    }
  }, [outlet]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.outletName.trim() || !form.outletType) {
      setError('Outlet name and outlet type are required.');
      return;
    }
    if (form.outletType === 'OTHER' && !form.outletTypeOther.trim()) {
      setError('Specify the other outlet type.');
      return;
    }
    if (!form.county.trim()) {
      setError('County is required.');
      return;
    }
    if (!form.subCounty.trim()) {
      setError('Sub-County is required.');
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || 'Failed to save outlet.');
    }
  };

  const subCounties = form.county
    ? regions.find((region) => region.county === form.county)?.subCounties || []
    : [];

  const inputClass =
    'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-kvb-green focus:outline-none focus:ring-1 focus:ring-kvb-green';
  const labelClass =
    'block text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1 outlet-edit-label';

  return (
    <form onSubmit={handleSubmit} className="inspection-form-section">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Object.keys(FIELD_LABELS).map((field) => (
          <div key={field} className={field === 'address' || field === 'outletTypeOther' ? 'md:col-span-2' : ''}>
            <label className={labelClass} htmlFor={`outlet-${field}`}>
              {FIELD_LABELS[field]}
            </label>
            {field === 'outletType' ? (
              <select
                id="outlet-outletType"
                className={inputClass}
                value={form.outletType}
                onChange={handleChange('outletType')}
              >
                {OUTLET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : field === 'county' ? (
              <select
                id="outlet-county"
                className={inputClass}
                value={form.county}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, county: e.target.value, subCounty: '' }));
                }}
              >
                <option value="">Select county…</option>
                {regions.map((region) => (
                  <option key={region.county} value={region.county}>
                    {region.county}
                  </option>
                ))}
              </select>
            ) : field === 'subCounty' ? (
              <select
                id="outlet-subCounty"
                className={inputClass}
                value={form.subCounty}
                onChange={handleChange('subCounty')}
                disabled={!form.county}
              >
                <option value="">Select sub-county…</option>
                {subCounties.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            ) : field === 'ownerTrainingLevel' ? (
              <select
                id="outlet-ownerTrainingLevel"
                className={inputClass}
                value={form.ownerTrainingLevel}
                onChange={handleChange('ownerTrainingLevel')}
              >
                <option value="">Select level of training…</option>
                {trainingLevelOptions(FALLBACK_TRAINING_LEVELS, form.ownerTrainingLevel).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`outlet-${field}`}
                className={inputClass}
                value={form[field]}
                onChange={handleChange(field)}
                type={field === 'ownerEmail' ? 'email' : 'text'}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="inspection-form-error" role="alert" style={{ marginTop: '1rem' }}>
          <i className="fa fa-circle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="inspection-form-actions" style={{ marginTop: '1.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Outlet'}
        </button>
        <Link href="/outlets" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </Link>
      </div>
    </form>
  );
}