'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useInspections } from '../../hooks/useInspections';
import StatusBadge from '../../components/StatusBadge';
import { toDateInputValue } from '../../lib/inspectionForm';
import '../../styles/InspectionForm.css';

export default function ReportsPage() {
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 25 });
  const { data, loading } = useInspections(filters);
  const items = data.items || [];
  const total = data.total || 0;

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const ids = items.map((i: { _id: string }) => i._id);
    if (ids.length === 0) {
      alert('No inspections to export.');
      return;
    }
    const qs = new URLSearchParams({ format, ids: ids.join(',') });
    window.open(`/api/inspections/export?${qs}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <ProtectedRoute>
      <div className="inspection-form-shell">
        <div className="inspection-form-bg-blob inspection-form-blob-1" />
        <div className="inspection-form-bg-blob inspection-form-blob-2" />

        <header className="inspection-form-header">
          <div className="inspection-form-header-inner">
            <div className="inspection-breadcrumb">
              <Link href="/dashboard"><i className="fa fa-tachometer-alt" aria-hidden="true" /> Dashboard</Link>
              <span aria-hidden="true">/</span>
              <span>Reports</span>
            </div>
          </div>
        </header>

        <main className="inspection-form-main">
          <div className="lp-container">
            <h1 className="inspection-page-title">Reports &amp; Exports</h1>
            <p className="inspection-field-hint" style={{ marginBottom: '1.5rem' }}>
              Generate compliance reports from inspection records. Select a format and download.
            </p>

            <div className="inspection-form-section">
              <h2 className="inspection-section-title">Export Format</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => handleExport('pdf')}>
                  <i className="fa fa-file-pdf" aria-hidden="true" /> Export PDF
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleExport('word')}>
                  <i className="fa fa-file-word" aria-hidden="true" /> Export Word
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleExport('excel')}>
                  <i className="fa fa-file-excel" aria-hidden="true" /> Export Excel
                </button>
              </div>
            </div>

            <div className="inspection-form-section">
              <h2 className="inspection-section-title">Filter Inspections</h2>
              <div className="inspection-filter-bar" style={{ marginTop: '1rem' }}>
                <select
                  className="inspection-field"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  style={{ height: '52px', padding: '0.75rem 1rem', border: '2px solid rgba(229,231,235,0.8)', borderRadius: '14px', fontSize: '0.95rem', background: '#f9fafb' }}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PENDING_DIRECTOR_REVIEW">Pending Director Review</option>
                  <option value="DIRECTOR_APPROVED">Director Approved</option>
                  <option value="PENDING_CEO_REVIEW">Pending Final Approval</option>
                  <option value="RETURNED_TO_INSPECTOR">Returned</option>
                  <option value="FINAL_APPROVED">Final Approved</option>
                </select>
              </div>
            </div>

            <div className="inspection-form-section">
              <h2 className="inspection-section-title">Inspection Records ({total})</h2>
              {loading ? (
                <p className="inspection-loading">Loading inspections…</p>
              ) : items.length === 0 ? (
                <p className="inspection-loading">No inspections found.</p>
              ) : (
                <div className="kvb-inspections-table kvb-table-reports" style={{ marginTop: '1rem' }}>
                  <div className="kvb-table-header">
                    <div className="kvb-table-cell">ID</div>
                    <div className="kvb-table-cell">Outlet</div>
                    <div className="kvb-table-cell">County</div>
                    <div className="kvb-table-cell">Status</div>
                    <div className="kvb-table-cell">Date</div>
                    <div className="kvb-table-cell">Action</div>
                  </div>
                   {items.map((inspection: any) => (
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
              )}
            </div>
          </div>
        </main>

        <footer className="inspection-form-footer">
          <div className="lp-container">
            <span>&copy; 2026 Kenya Veterinary Board. Upholding Veterinary Standards.</span>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}