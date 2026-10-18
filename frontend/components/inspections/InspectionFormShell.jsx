'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InspectionFormShell({ breadcrumb, title, actions, children }) {
  const router = useRouter();
  const now = new Date();
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][now.getMonth()];

  return (
    <div className="inspection-form-shell">
      <div className="inspection-form-bg-blob inspection-form-blob-1" />
      <div className="inspection-form-bg-blob inspection-form-blob-2" />

      <header className="inspection-form-header">
        <div className="inspection-form-header-inner">
          <div className="inspection-breadcrumb">
            <Link href="/dashboard"><i className="fa fa-tachometer-alt" aria-hidden="true" /> Dashboard</Link>
            {breadcrumb && <><span aria-hidden="true">/</span><span>{breadcrumb}</span></>}
          </div>

          <div className="dashboard-datetime">
            <div className="datetime-day">{day}</div>
            <div className="datetime-date">{now.getDate()} {month} {now.getFullYear()}</div>
            <div className="datetime-time">
              {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>

          <div className="inspection-header-actions">
            {actions}
            <button type="button" className="btn btn-secondary inspection-back-btn" onClick={() => router.back()}>
              <i className="fa fa-arrow-left" aria-hidden="true" /> Back
            </button>
          </div>
        </div>
      </header>

      <main className="inspection-form-main">
        <div className="lp-container">
          {title && <h1 className="inspection-page-title">{title}</h1>}
          {children}
        </div>
      </main>

      <footer className="inspection-form-footer">
        <div className="lp-container">
          <span>&copy; 2026 Kenya Veterinary Board. Upholding Veterinary Standards.</span>
        </div>
      </footer>
    </div>
  );
}