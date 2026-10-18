'use client';

import { FormField, FormSection } from './FormField';
import { useRegions, useSubCounties } from '../../hooks/useInspectionFormSchema';
import { LIMITS } from '../../lib/inspectionForm';
import api from '../../lib/api';
import { useState, useEffect, useCallback } from 'react';

export default function OutletDetailsStep({
  formData,
  errors,
  outlets,
  selectedOutletId,
  onSelectOutlet,
  onOutletCreated,
  onChange,
  onLocationChange,
  outletTypes,
  readOnly,
}) {
  const { regions } = useRegions();
  const { outletInformation, location } = formData;

  const [isCreating, setIsCreating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [gpsError, setGpsError] = useState('');
  const [formOutletName, setFormOutletName] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formCounty, setFormCounty] = useState('');
  const [formSubCounty, setFormSubCounty] = useState('');
  const [formCentre, setFormCentre] = useState('');
  const [formOutletType, setFormOutletType] = useState('AGROVET');
  const [gpsTrigger, setGpsTrigger] = useState(0);

  const subCountiesForExisting = useSubCounties(formData.outletInformation.county);
  const subCountiesForCreating = useSubCounties(formCounty);
  const subCounties = isCreating ? subCountiesForCreating : subCountiesForExisting;

  useEffect(() => {
    // Only leave creation mode when a real outlet ID is selected.
    // Empty string or the '__new__' sentinel means the user wants to
    // create a new outlet — do not reset isCreating in those cases.
    if (selectedOutletId && selectedOutletId !== '__new__') {
      setIsCreating(false);
      setGpsStatus('idle');
      setGpsError('');
    }
  }, [selectedOutletId]);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    setGpsStatus('requesting');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange('latitude', String(position.coords.latitude));
        onLocationChange('longitude', String(position.coords.longitude));
        setGpsStatus('success');
        setGpsError('');
      },
      (error) => {
        let message = 'Failed to capture location.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access denied. Please enable location permissions or enter coordinates manually.';
          setGpsStatus('denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
          setGpsStatus('error');
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Try again or enter coordinates manually.';
          setGpsStatus('error');
        }
        setGpsError(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [onLocationChange]);

  const autoCaptureGps = useCallback(() => {
    if (!navigator.geolocation) return;
    let name, county, subCounty, lat, lng;
    if (isCreating) {
      name = formOutletName;
      county = formCounty;
      subCounty = formSubCounty;
      lat = location.latitude;
      lng = location.longitude;
    } else {
      name = outletInformation.outletName;
      county = outletInformation.county;
      subCounty = outletInformation.subCounty;
      lat = location.latitude;
      lng = location.longitude;
    }
    if (name && county && subCounty && (!lat || !lng)) {
      setGpsStatus('requesting');
      setGpsError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange('latitude', String(position.coords.latitude));
          onLocationChange('longitude', String(position.coords.longitude));
          setGpsStatus('success');
          setGpsError('');
        },
        (error) => {
          let message = 'GPS location unavailable — enter coordinates manually.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission denied. Enter coordinates manually.';
            setGpsStatus('denied');
          } else if (error.code === error.TIMEOUT) {
            message = 'GPS request timed out. Enter coordinates manually.';
            setGpsStatus('error');
          } else {
            setGpsStatus('error');
          }
          setGpsError(message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    }
  }, [isCreating, formOutletName, formCounty, formSubCounty, location.latitude, location.longitude, outletInformation.outletName, outletInformation.county, outletInformation.subCounty, onLocationChange]);

  // Auto-trigger GPS capture once Agrovet name, County, and Sub-county are provided.
  useEffect(() => {
    let name, county, subCounty, lat, lng;
    if (isCreating) {
      name = formOutletName;
      county = formCounty;
      subCounty = formSubCounty;
      lat = location.latitude;
      lng = location.longitude;
    } else {
      name = outletInformation.outletName;
      county = outletInformation.county;
      subCounty = outletInformation.subCounty;
      lat = location.latitude;
      lng = location.longitude;
    }
    if (name && county && subCounty && (!lat || !lng) && gpsStatus === 'idle') {
      setGpsTrigger((t) => t + 1);
    }
  }, [isCreating, formOutletName, formCounty, formSubCounty, location.latitude, location.longitude, outletInformation.outletName, outletInformation.county, outletInformation.subCounty, gpsStatus]);

  useEffect(() => {
    if (gpsTrigger > 0 && gpsStatus === 'requesting') {
      autoCaptureGps();
    }
  }, [gpsTrigger, gpsStatus, autoCaptureGps]);

  const handleCreateOutlet = useCallback(async () => {
    setGpsError('');
    try {
      const { data } = await api.post('/outlets', {
        outletName: formOutletName,
        outletType: formOutletType,
        ownerName: formOwnerName,
        county: formCounty,
        subCounty: formSubCounty,
        centre: formCentre,
      });
      const newOutlet = data.item || data;
      if (newOutlet?._id) {
        onSelectOutlet(newOutlet._id);
        onOutletCreated?.(newOutlet);
        setIsCreating(false);
        setFormOutletName('');
        setFormOwnerName('');
        setFormCounty('');
        setFormSubCounty('');
        setFormCentre('');
        setFormOutletType('AGROVET');
        setGpsTrigger(0);
        setGpsStatus('idle');
        setGpsError('');
      }
    } catch (error) {
      setGpsError(error.response?.data?.message || 'Failed to create outlet.');
    }
  }, [formOutletName, formOwnerName, formCounty, formSubCounty, formCentre, formOutletType, onSelectOutlet, onOutletCreated]);

  return (
    <FormSection number="2" title="Outlet Details" description="Identify the veterinary inputs outlet being inspected.">
      <div className="inspection-form-grid">
        <FormField id="outlet" label="Outlet Record" required error={errors.outlet} full hint="Select an existing outlet or create a new one.">
          <select
            id="outlet"
            value={isCreating ? '__new__' : (selectedOutletId || '')}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '__new__') {
                setIsCreating(true);
                setGpsError('');
                onSelectOutlet('');
              } else {
                setIsCreating(false);
                setGpsError('');
                setFormOutletName('');
                setFormOwnerName('');
                setFormCounty('');
                setFormSubCounty('');
                setFormCentre('');
                setFormOutletType('AGROVET');
                onSelectOutlet(value);
              }
            }}
            disabled={readOnly}
            required
            aria-invalid={Boolean(errors.outlet)}
          >
            <option value="">-- Select an outlet --</option>
            {outlets.map((outlet) => (
              <option key={outlet._id} value={outlet._id}>
                {outlet.outletName} — {outlet.county || 'No county'}
              </option>
            ))}
            <option value="__new__">+ Create New Outlet</option>
          </select>
        </FormField>

        {isCreating ? (
          <>
            <FormField id="newOutletName" label="Outlet Name" required error={gpsError || errors['formData.outletInformation.outletName']}>
              <input
                id="newOutletName"
                type="text"
                value={formOutletName}
                onChange={(event) => setFormOutletName(event.target.value)}
                disabled={readOnly}
                maxLength={LIMITS.nameMax}
                placeholder="Enter the new outlet name"
              />
            </FormField>

            <FormField id="newOwnerName" label="Owner Name" required>
              <input
                id="newOwnerName"
                type="text"
                value={formOwnerName}
                onChange={(event) => setFormOwnerName(event.target.value)}
                disabled={readOnly}
                maxLength={LIMITS.nameMax}
                placeholder="Owner name"
              />
            </FormField>

            <FormField id="newOutletType" label="Type of Outlet">
              <select
                id="newOutletType"
                value={formOutletType}
                onChange={(event) => setFormOutletType(event.target.value)}
                disabled={readOnly}
              >
                {outletTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </FormField>

            <FormField id="newCounty" label="County" required>
              <select
                id="newCounty"
                value={formCounty}
                onChange={(event) => {
                  setFormCounty(event.target.value);
                  setFormSubCounty('');
                }}
                disabled={readOnly}
              >
                <option value="">-- Select county --</option>
                {regions.map((region) => (
                  <option key={region.county} value={region.county}>{region.county}</option>
                ))}
              </select>
            </FormField>

            <FormField id="newSubCounty" label="Sub-County" required>
              <select
                id="newSubCounty"
                value={formSubCounty}
                onChange={(event) => setFormSubCounty(event.target.value)}
                disabled={readOnly || !formCounty}
              >
                <option value="">{formCounty ? '-- Select sub-county --' : '-- Select a county first --'}</option>
                {formCounty && subCounties.map((subCounty) => (
                  <option key={subCounty} value={subCounty}>{subCounty}</option>
                ))}
              </select>
            </FormField>

            <FormField id="newCentre" label="Centre">
              <input
                id="newCentre"
                type="text"
                value={formCentre}
                onChange={(event) => setFormCentre(event.target.value)}
                disabled={readOnly}
                maxLength={LIMITS.nameMax}
              />
            </FormField>

            <FormField id="latitude" label="Latitude">
              <input
                id="latitude"
                type="text"
                value={location.latitude}
                onChange={(event) => onLocationChange('latitude', event.target.value)}
                disabled={readOnly}
                placeholder="e.g. -1.2921"
              />
            </FormField>

            <FormField id="longitude" label="Longitude">
              <input
                id="longitude"
                type="text"
                value={location.longitude}
                onChange={(event) => onLocationChange('longitude', event.target.value)}
                disabled={readOnly}
                placeholder="e.g. 36.8219"
              />
            </FormField>

            {!readOnly && (
              <div className="inspection-new-outlet-actions">
                <button type="button" className="btn btn-secondary" onClick={captureLocation} disabled={gpsStatus === 'requesting'}>
                  {gpsStatus === 'requesting' ? (
                    <>
                      <i className="fa fa-circle-notch fa-spin" aria-hidden="true" /> Capturing GPS…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-location-crosshairs" aria-hidden="true" /> Capture Live Location
                    </>
                  )}
                </button>
                <p className="inspection-field-hint">Uses online GPS to capture precise geographical coordinates of the Agrovet for maximum accuracy.</p>
                {gpsStatus === 'success' && (
                  <span className="gps-status gps-status-success">
                    <i className="fa fa-check-circle" aria-hidden="true" /> GPS location captured
                  </span>
                )}
                {(gpsStatus === 'error' || gpsStatus === 'denied') && (
                  <span className="gps-status gps-status-error">
                    <i className="fa fa-triangle-exclamation" aria-hidden="true" /> {gpsError}
                  </span>
                )}
                <button type="button" className="btn btn-primary" onClick={handleCreateOutlet} disabled={!formOutletName || !formOwnerName || !formCounty}>
                  Create & Select Outlet
                </button>
              </div>
            )}

            {gpsError && gpsStatus !== 'requesting' && <p className="inspection-field-error" role="alert">{gpsError}</p>}
          </>
        ) : (
          <>
            <FormField
              id="outletName"
              label="Name of Outlet"
              required
              error={errors['formData.outletInformation.outletName']}
            >
              <input
                id="outletName"
                type="text"
                value={outletInformation.outletName}
                onChange={(event) => onChange('outletName', event.target.value)}
                disabled={readOnly}
                maxLength={LIMITS.nameMax}
                required
                aria-invalid={Boolean(errors['formData.outletInformation.outletName'])}
              />
            </FormField>

            <FormField
              id="outletType"
              label="Type of Outlet"
              required
              error={errors['formData.outletInformation.outletType']}
            >
              <select
                id="outletType"
                value={outletInformation.outletType}
                onChange={(event) => onChange('outletType', event.target.value)}
                disabled={readOnly}
                required
                aria-invalid={Boolean(errors['formData.outletInformation.outletType'])}
              >
                <option value="">-- Select type --</option>
                {outletTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </FormField>

            {outletInformation.outletType === 'OTHER' && (
              <FormField
                id="otherType"
                label="Specify Other Outlet Type"
                required
                error={errors['formData.outletInformation.otherType']}
              >
                <input
                  id="otherType"
                  type="text"
                  value={outletInformation.otherType}
                  onChange={(event) => onChange('otherType', event.target.value)}
                  disabled={readOnly}
                  maxLength={LIMITS.otherTypeMax}
                  required
                  aria-invalid={Boolean(errors['formData.outletInformation.otherType'])}
                />
              </FormField>
            )}

            <FormField id="county" label="County" required error={errors['formData.outletInformation.county']}>
              <select
                id="county"
                value={outletInformation.county}
                onChange={(event) => onChange('county', event.target.value)}
                disabled={readOnly}
                required
                aria-invalid={Boolean(errors['formData.outletInformation.county'])}
              >
                <option value="">-- Select county --</option>
                {regions.map((region) => (
                  <option key={region.county} value={region.county}>{region.county}</option>
                ))}
              </select>
            </FormField>

            <FormField id="subCounty" label="Sub-County" required error={errors['formData.outletInformation.subCounty']}>
              <select
                id="subCounty"
                value={outletInformation.subCounty}
                onChange={(event) => onChange('subCounty', event.target.value)}
                disabled={readOnly || !outletInformation.county}
                required
                aria-invalid={Boolean(errors['formData.outletInformation.subCounty'])}
              >
                <option value="">{outletInformation.county ? '-- Select sub-county --' : '-- Select a county first --'}</option>
                {subCounties.map((subCounty) => (
                  <option key={subCounty} value={subCounty}>{subCounty}</option>
                ))}
              </select>
            </FormField>

            <FormField id="centre" label="Centre">
              <input
                id="centre"
                type="text"
                value={outletInformation.centre}
                onChange={(event) => onChange('centre', event.target.value)}
                disabled={readOnly}
                maxLength={LIMITS.nameMax}
              />
            </FormField>

            <FormField id="latitude" label="Latitude">
              <input
                id="latitude"
                type="text"
                value={location.latitude}
                onChange={(event) => onLocationChange('latitude', event.target.value)}
                disabled={readOnly}
                placeholder="e.g. -1.2921"
              />
            </FormField>

            <FormField id="longitude" label="Longitude">
              <input
                id="longitude"
                type="text"
                value={location.longitude}
                onChange={(event) => onLocationChange('longitude', event.target.value)}
                disabled={readOnly}
                placeholder="e.g. 36.8219"
              />
            </FormField>

            {!readOnly && (
              <div className="inspection-form-actions">
                <button type="button" className="btn btn-secondary" onClick={captureLocation} disabled={gpsStatus === 'requesting'}>
                  {gpsStatus === 'requesting' ? (
                    <>
                      <i className="fa fa-circle-notch fa-spin" aria-hidden="true" /> Capturing GPS…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-location-crosshairs" aria-hidden="true" /> Capture Live Location
                    </>
                  )}
                </button>
                {gpsStatus === 'success' && (
                  <span className="gps-status gps-status-success">
                    <i className="fa fa-check-circle" aria-hidden="true" /> GPS location captured
                  </span>
                )}
                {(gpsStatus === 'error' || gpsStatus === 'denied') && (
                  <span className="gps-status gps-status-error">
                    <i className="fa fa-triangle-exclamation" aria-hidden="true" /> {gpsError}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </FormSection>
  );
}
