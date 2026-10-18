'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { useOutlet, useUpdateOutlet } from '../../../hooks/useOutlets';
import InspectionFormShell from '../../../components/inspections/InspectionFormShell';
import OutletEditForm from '../../../components/outlets/OutletEditForm';
import '../../../styles/InspectionForm.css';

export default function OutletDetailPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  // In Next.js 16 / React 19, `params` is a Promise and must be unwrapped
  // with React.use() before its properties can be accessed.
  const { id } = use(params);
  const { outlet, loading, error } = useOutlet(id);
  const canManage = user?.role === 'SYSTEM_ADMIN' || user?.role === 'DIRECTOR';

  const updateMutation = useUpdateOutlet();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!loading && error) {
      router.replace('/outlets');
    }
  }, [loading, error, router]);

  const handleSave = async (form) => {
    setSaveError('');
    try {
      await updateMutation.mutateAsync({ id, ...form });
      setEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save outlet changes.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Outlets" title="Outlet Details">
          <div className="inspection-form-section"><p className="inspection-loading">Loading outlet…</p></div>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  if (!outlet) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Outlets" title="Outlet Details">
          <div className="inspection-form-section">
            <p className="inspection-form-error"><i className="fa fa-circle-exclamation" aria-hidden="true" /> Outlet not found.</p>
            <Link href="/outlets" className="btn btn-secondary">Back to outlets</Link>
          </div>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <InspectionFormShell
        breadcrumb={<Link href="/outlets">Outlets</Link>}
        title={outlet.outletName || 'Outlet Details'}
        actions={canManage && (
          editing ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setEditing(false); setSaveError(''); }}
            >
              <i className="fa fa-times" aria-hidden="true" /> Cancel
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              <i className="fa fa-pen" aria-hidden="true" /> Edit Outlet
            </button>
          )
        )}
      >
        {editing ? (
          <OutletEditForm
            outlet={outlet}
            onCancel={() => { setEditing(false); setSaveError(''); }}
            onSubmit={handleSave}
            submitting={updateMutation.isPending}
          />
        ) : (
          <div className="inspection-form-section">
            <div className="kvb-inspections-table kvb-table-detail">
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Outlet Name</strong></div>
                <div className="kvb-table-cell">{outlet.outletName || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Outlet Type</strong></div>
                <div className="kvb-table-cell">{outlet.outletType || '—'}</div>
              </div>
              {outlet.outletTypeOther && (
                <div className="kvb-table-row">
                  <div className="kvb-table-cell"><strong>Other Type</strong></div>
                  <div className="kvb-table-cell">{outlet.outletTypeOther}</div>
                </div>
              )}
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Owner Name</strong></div>
                <div className="kvb-table-cell">{outlet.ownerName || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Owner Email</strong></div>
                <div className="kvb-table-cell">{outlet.ownerEmail || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Owner Phone</strong></div>
                <div className="kvb-table-cell">{outlet.ownerPhone || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>County</strong></div>
                <div className="kvb-table-cell">{outlet.county || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Sub-County</strong></div>
                <div className="kvb-table-cell">{outlet.subCounty || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Centre</strong></div>
                <div className="kvb-table-cell">{outlet.centre || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Address</strong></div>
                <div className="kvb-table-cell">{outlet.address || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>KVB Registration</strong></div>
                <div className="kvb-table-cell">{outlet.kvbRegistrationInfo || '—'}</div>
              </div>
              <div className="kvb-table-row">
                <div className="kvb-table-cell"><strong>Training Level</strong></div>
                <div className="kvb-table-cell">{outlet.ownerTrainingLevel || '—'}</div>
              </div>
              {outlet.latitude && (
                <div className="kvb-table-row">
                  <div className="kvb-table-cell"><strong>Coordinates</strong></div>
                  <div className="kvb-table-cell">{outlet.latitude}, {outlet.longitude}</div>
                </div>
              )}
            </div>

            {saveError && (
              <div className="inspection-form-error" role="alert" style={{ marginTop: '1.5rem' }}>
                <i className="fa fa-circle-exclamation" aria-hidden="true" /> {saveError}
              </div>
            )}

            <div className="inspection-form-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                <i className="fa fa-pen" aria-hidden="true" /> Edit Agrovet Details
              </button>
              <Link href="/outlets" className="btn btn-secondary">Back to outlets</Link>
            </div>
          </div>
        )}
      </InspectionFormShell>
    </ProtectedRoute>
  );
}