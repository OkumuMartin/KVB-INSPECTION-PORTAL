'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useOutlets, useDeleteOutlet } from '../../hooks/useOutlets';
import InspectionFormShell from '../../components/inspections/InspectionFormShell';
import '../../styles/InspectionForm.css';

const PAGE_SIZE = 20;

export default function OutletsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [county, setCounty] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, county]);

  const { data, loading, error, refetch } = useOutlets({ search: debouncedSearch, county, page, limit: PAGE_SIZE });
  const items = data.items || [];
  const total = data.total || 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const canManage = user?.role === 'SYSTEM_ADMIN' || user?.role === 'DIRECTOR';

  const deleteMutation = useDeleteOutlet();
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteClick = (id) => {
    setDeletingId(null);
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

  return (
    <ProtectedRoute>
      <InspectionFormShell
        breadcrumb="Outlets"
        title="Manage Outlets"
        actions={canManage && (
          <Link href="/outlets/new" className="btn btn-primary">
            <i className="fa fa-plus" aria-hidden="true" /> New Outlet
          </Link>
        )}
      >
        <div className="inspection-filter-bar">
          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="outletSearch">Search</label>
            <input
              id="outletSearch"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Outlet name, owner, or county"
            />
          </div>
          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="outletCounty">County</label>
            <input
              id="outletCounty"
              type="text"
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              placeholder="Filter by county"
            />
          </div>
        </div>

        {error && (
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {error}
            <button type="button" className="btn btn-ghost btn-sm" onClick={refetch}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="inspection-form-section"><p className="inspection-loading">Loading outlets…</p></div>
        ) : items.length === 0 ? (
          <div className="inspection-form-section">
            <p className="inspection-loading">
              No outlets found. {canManage && <> <Link href="/outlets/new">Create a new outlet.</Link></>}
            </p>
          </div>
        ) : (
          <>
            <div className="kvb-inspections-table kvb-table-outlets">
              <div className="kvb-table-header">
                <div className="kvb-table-cell">Outlet Name</div>
                <div className="kvb-table-cell">Type</div>
                <div className="kvb-table-cell">County</div>
                <div className="kvb-table-cell">Sub-County</div>
                <div className="kvb-table-cell">Owner</div>
                <div className="kvb-table-cell">KVB Reg.</div>
                <div className="kvb-table-cell">Action</div>
              </div>
              {items.map((outlet) => (
                <div key={outlet._id} className="kvb-table-row">
                  <div className="kvb-table-cell">{outlet.outletName || 'N/A'}</div>
                  <div className="kvb-table-cell">{outlet.outletType || '—'}</div>
                  <div className="kvb-table-cell">{outlet.county || '—'}</div>
                  <div className="kvb-table-cell">{outlet.subCounty || '—'}</div>
                  <div className="kvb-table-cell">{outlet.ownerName || '—'}</div>
                  <div className="kvb-table-cell">{outlet.kvbRegistrationInfo || '—'}</div>
                  <div className="kvb-table-cell">
                    <Link href={`/outlets/${outlet._id}`} className="btn btn-ghost btn-sm">
                      <i className="fa fa-eye" aria-hidden="true" /> View
                    </Link>
                    {canManage && (
                      <>
                        <Link href={`/outlets/${outlet._id}/edit`} className="btn btn-ghost btn-sm">
                          <i className="fa fa-pen" aria-hidden="true" /> Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-danger"
                          onClick={() => handleDeleteClick(outlet._id)}
                          disabled={deletingId === outlet._id}
                          aria-label={`Delete ${outlet.outletName}`}
                        >
                          {deletingId === outlet._id ? (
                            <span className="loading-inline">Deleting…</span>
                          ) : (
                            <>
                              <i className="fa fa-trash" aria-hidden="true" /> Delete
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <nav className="inspection-pagination" aria-label="Outlet pages">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span aria-live="polite">Page {page} of {totalPages} &middot; {total} record(s)</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Next
              </button>
              </nav>

              {confirmDeleteId && (
                <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
                  <div className="confirm-dialog">
                    <h3 id="confirm-delete-title" className="confirm-title">Delete outlet?</h3>
                    <p className="confirm-text">This cannot be undone. All inspection records linked to this outlet will remain but the outlet reference will be removed.</p>
                    <div className="confirm-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelDelete}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={handleConfirmDelete}
                        disabled={deletingId === confirmDeleteId}
                      >
                        {deletingId === confirmDeleteId ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </InspectionFormShell>
    </ProtectedRoute>
  );
}