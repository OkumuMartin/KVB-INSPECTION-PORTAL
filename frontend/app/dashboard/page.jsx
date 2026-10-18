'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { KvbLogoSmall } from '../../components/KvbLogo';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { useInspections } from '../../hooks/useInspections';
import { toDateInputValue } from '../../lib/inspectionForm';
import '../../styles/InspectionForm.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const inspectorQuickActions = [
  { label: 'New Inspection', desc: 'Start a new outlet inspection', icon: 'fa-plus', href: '/inspections/new', color: 'green' },
  { label: 'View Inspections', desc: 'Browse all inspections', icon: 'fa-clipboard-list', href: '/inspections', color: 'navy' },
  { label: 'Generate Report', desc: 'Create compliance reports', icon: 'fa-file-pdf', href: '/reports', color: 'gold' },
  { label: 'Outlets', desc: 'Manage outlet records', icon: 'fa-building', href: '/outlets', color: 'green' },
];

const directorQuickActions = [
  { label: 'Pending Reviews', desc: 'Inspections awaiting your review', icon: 'fa-hourglass-half', href: '/inspections?status=PENDING_DIRECTOR_REVIEW', color: 'gold' },
  { label: 'View All', desc: 'Browse all inspections', icon: 'fa-clipboard-list', href: '/inspections', color: 'navy' },
  { label: 'Outlets', desc: 'Manage outlet records', icon: 'fa-building', href: '/outlets', color: 'green' },
  { label: 'Generate Report', desc: 'Create compliance reports', icon: 'fa-file-pdf', href: '/reports', color: 'green' },
];

const ceoQuickActions = [
  { label: 'Final Approvals', desc: 'Inspections awaiting final approval', icon: 'fa-gavel', href: '/inspections?status=PENDING_CEO_REVIEW', color: 'red' },
  { label: 'View All', desc: 'Browse all inspections', icon: 'fa-clipboard-list', href: '/inspections', color: 'navy' },
  { label: 'Generate Report', desc: 'Create compliance reports', icon: 'fa-file-pdf', href: '/reports', color: 'green' },
];

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const { data } = useInspections({ page: 1, limit: 5 });

  const recentInspections = data.items || [];
  const totalInspections = data.total || 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingReview = recentInspections.filter((entry) =>
    ['PENDING_DIRECTOR_REVIEW', 'PENDING_CEO_REVIEW'].includes(entry.status)).length;
  const returned = recentInspections.filter((entry) => entry.status === 'RETURNED_TO_INSPECTOR').length;
  const complianceRate = recentInspections.length
    ? Math.round(recentInspections.reduce((sum, entry) => sum + (entry.compliance?.complianceRate || 0), 0) / recentInspections.length)
    : 0;

  const day = dayNames[now.getDay()];
  const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = formatTime(now);

  const quickActions = user?.role === 'DIRECTOR' ? directorQuickActions :
    user?.role === 'CEO_REGISTRAR' ? ceoQuickActions : inspectorQuickActions;

  const dashboardTitle = user?.role === 'DIRECTOR' ? 'Director Dashboard' :
    user?.role === 'CEO_REGISTRAR' ? 'CEO / Registrar Dashboard' : 'Inspector Dashboard';

  return (
    <ProtectedRoute>
      <div className="dashboard-shell">
        <div className="kvb-bg-blob kvb-blob-1"></div>
        <div className="kvb-bg-blob kvb-blob-2"></div>

        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <button
              type="button"
              className="dashboard-logo"
              onClick={() => window.location.reload()}
              aria-label="Kenya Veterinary Board - Home"
            >
              <KvbLogoSmall size={64} />
              <div className="dashboard-logo-text">
                <span className="dashboard-logo-name">Kenya Veterinary Board</span>
                <span className="dashboard-logo-tagline">Inspection Portal</span>
              </div>
            </button>

            <div className="dashboard-datetime">
              <div className="datetime-day">{day}</div>
              <div className="datetime-date">{dateStr}</div>
              <div className="datetime-time">{timeStr}</div>
            </div>

            <div className="dashboard-header-user">
              <button onClick={logout} className="btn btn-secondary dashboard-signout">
                <i className="fa fa-right-from-bracket"></i> Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-container">
            <div className="dashboard-hero">
              <div className="dashboard-hero-text">
                <h1 className="dashboard-hero-title">{dashboardTitle}</h1>
                <p className="dashboard-hero-sub">
                  Welcome back. Monitor inspection progress, generate reports, and ensure regulatory compliance.
                </p>
              </div>
              <div className="dashboard-hero-stats">
                <div className="hero-stat-item">
                  <div className="hero-stat-value">{totalInspections}</div>
                  <div className="hero-stat-label">Total Inspections</div>
                </div>
                <div className="hero-stat-item">
                  <div className="hero-stat-value">{pendingReview}</div>
                  <div className="hero-stat-label">Pending Review</div>
                </div>
                <div className="hero-stat-item">
                  <div className="hero-stat-value">{complianceRate}%</div>
                  <div className="hero-stat-label">Compliance Rate</div>
                </div>
                <div className="hero-stat-item">
                  <div className="hero-stat-value">{returned}</div>
                  <div className="hero-stat-label">Returned</div>
                </div>
              </div>
            </div>

            <div className="dashboard-welcome">
              <h2 className="dashboard-welcome-title">
                <i className="fa fa-tachometer-alt"></i> {user?.name || 'User'}
              </h2>
              <p className="dashboard-welcome-sub">
                Role: {user?.role || 'Inspector'} | You are logged in to the Kenya Veterinary Board Inspection Portal.
              </p>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header-row">
                <h2 className="dashboard-section-title"><i className="fa fa-bolt"></i> Quick Actions</h2>
              </div>
              <div className="kvb-quick-actions">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href} className="kvb-action-card">
                    <div className={`kvb-action-icon kvb-action-${action.color}`}>
                      <i className={`fa ${action.icon}`}></i>
                    </div>
                    <div className="kvb-action-label">{action.label}</div>
                    <div className="kvb-action-desc">{action.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header-row">
                <h2 className="dashboard-section-title"><i className="fa fa-clipboard-list"></i> Recent Inspections</h2>
                <Link href="/inspections" className="dashboard-view-all">
                  View all <i className="fa fa-arrow-right"></i>
                </Link>
              </div>
              <div className="kvb-inspections-table kvb-table-dashboard">
                <div className="kvb-table-header">
                  <div className="kvb-table-cell">ID</div>
                  <div className="kvb-table-cell">Outlet</div>
                  <div className="kvb-table-cell">County</div>
                  <div className="kvb-table-cell">Status</div>
                  <div className="kvb-table-cell">Date</div>
                  <div className="kvb-table-cell">Action</div>
                </div>
                {recentInspections.length === 0 && (
                  <p className="inspection-loading">
                    No inspections yet. <Link href="/inspections/new">Start a new inspection.</Link>
                  </p>
                )}
                {recentInspections.map((inspection) => (
                  <div key={inspection._id} className="kvb-table-row">
                    <div className="kvb-table-cell kvb-table-id">{inspection.inspectionNumber}</div>
                    <div className="kvb-table-cell">
                      {inspection.formData?.outletInformation?.outletName || inspection.outlet?.outletName || 'N/A'}
                    </div>
                    <div className="kvb-table-cell">
                      {inspection.formData?.outletInformation?.county || 'N/A'}
                    </div>
                    <div className="kvb-table-cell">
                      <StatusBadge status={inspection.status} />
                    </div>
                    <div className="kvb-table-cell">{toDateInputValue(inspection.inspectionDate)}</div>
                    <div className="kvb-table-cell">
                      <Link href={`/inspections/${inspection._id}`} className="btn btn-ghost btn-sm">
                        <i className="fa fa-eye" aria-hidden="true" /> View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="dashboard-footer">
          <div className="dashboard-footer-inner">
            <span>&copy; 2026 Kenya Veterinary Board. Upholding Veterinary Standards.</span>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
