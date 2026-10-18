'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { useCreateOutlet } from '../../../hooks/useOutlets';
import InspectionFormShell from '../../../components/inspections/InspectionFormShell';
import OutletEditForm from '../../../components/outlets/OutletEditForm';
import '../../../styles/InspectionForm.css';

export default function NewOutletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createMutation = useCreateOutlet();

  if (user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'DIRECTOR') {
    return (
      <ProtectedRoute>
        <InspectionFormShell breadcrumb="Outlets" title="New Outlet">
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> You do not have permission to create outlets.
          </div>
          <Link href="/outlets" className="btn btn-secondary">Back to outlets</Link>
        </InspectionFormShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <InspectionFormShell breadcrumb="Outlets" title="New Outlet">
        <OutletEditForm
          onCancel={() => router.push('/outlets')}
          onSubmit={async (data) => {
            const created = await createMutation.mutateAsync(data);
            router.push(`/outlets/${created.item?._id || created.data?.item?._id}`);
          }}
        />
      </InspectionFormShell>
    </ProtectedRoute>
  );
}