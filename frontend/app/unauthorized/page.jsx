'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { KvbLogoSmall } from '../../components/KvbLogo';
import '../../styles/InspectionForm.css';

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect back to the previous page after a short delay so the
    // user is not stranded on a dead-end screen.
    const timer = setTimeout(() => router.back(), 8000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="inspection-form-wrapper">
        <div className="inspection-form-section" style={{ textAlign: 'center', maxWidth: '480px', margin: '4rem auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <KvbLogoSmall size={64} />
          </div>

          <h1 style={{ color: '#c9a44c', marginBottom: '0.5rem' }}>
            <i className="fa fa-exclamation-triangle" aria-hidden="true" /> Access Denied
          </h1>
          <p className="inspection-loading" style={{ marginBottom: '1.5rem' }}>
            Your account role does not have permission to view this page.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary">
              <i className="fa fa-tachometer-alt" aria-hidden="true" /> Go to Dashboard
            </Link>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              <i className="fa fa-arrow-left" aria-hidden="true" /> Go Back
            </button>
          </div>

          <p className="inspection-loading" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
            Redirecting automatically in 8 seconds…
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}