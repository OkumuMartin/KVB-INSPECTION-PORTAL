'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useOutlet, useUpdateOutlet } from '../../../../hooks/useOutlets';
import InspectionFormShell from '../../../../components/inspections/InspectionFormShell';
import OutletEditForm from '../../../../components/outlets/OutletEditForm';
import '../../../../styles/InspectionForm.css';

export default function EditOutletPage({ params }) {
  const router = useRouter();
  // In Next.js 16 / React 19, `params` is a Promise and must be unwrapped
  // with React.use() before its properties can be accessed.
  const { id } = use(params);
  const { outlet, loading, error } = useOutlet(id);
  const updateOutlet = useUpdateOutlet();

  useEffect(() => {
    if (!loading && (error || !outlet)) {
      router.replace('/outlets');
    }
  }, [loading, error, outlet, router]);

  if (loading || !outlet) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Outlets" title="Edit Outlet">
          <div className="inspection-form-section">
            <p className="inspection-loading">Loading outlet…</p>
          </div>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Outlets" title="Edit Outlet">
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {error}
          </div>
          <Link href="/outlets" className="btn btn-secondary">Back to outlets</Link>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (form) => {
    await updateOutlet.mutateAsync({ id, ...form });
    router.push('/outlets');
  };

  return (
    <ProtectedRoute>
      <InspectionFormShell
        breadcrumb={<Link href="/outlets">Outlets</Link>}
        title={`Edit ${outlet.outletName}`}
      >
        <OutletEditForm
          outlet={outlet}
          submitting={updateOutlet.isPending}
          onCancel={() => router.push('/outlets')}
          onSubmit={handleSubmit}
        />
      </InspectionFormShell>
    </ProtectedRoute>
  );
}