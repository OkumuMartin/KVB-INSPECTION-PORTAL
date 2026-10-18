'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useInspections, STATUS_LABELS } from '../../hooks/useInspections';
import {
  useDirectorApprove,
  useFinalApprove,
  useRevertInspection,
  useReturnInspection,
} from '../../hooks/useInspectionActions';
import { useRegions } from '../../hooks/useInspectionFormSchema';
import InspectionFormShell from '../../components/inspections/InspectionFormShell';
import { toDateInputValue } from '../../lib/inspectionForm';
import '../../styles/InspectionForm.css';

const PAGE_SIZE = 20;

export default function InspectionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [county, setCounty] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [revertTargetId, setRevertTargetId] = useState(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertingId, setRevertingId] = useState(null);
  const [returnTargetId, setReturnTargetId] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [approveSuccessId, setApproveSuccessId] = useState(null);
  const [returnSuccessId, setReturnSuccessId] = useState(null);
  const [revertSuccessId, setRevertSuccessId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { regions } = useRegions();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, county, subCounty, dateFrom, dateTo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialStatus = params.get('status');
    if (initialStatus && STATUS_LABELS[initialStatus]) setStatus(initialStatus);
  }, []);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    status,
    county,
    subCounty,
    dateFrom,
    dateTo,
    page,
    limit: PAGE_SIZE,
  }), [debouncedSearch, status, county, subCounty, dateFrom, dateTo, page]);

  const { data, loading, error, refetch } = useInspections(filters);
  const items = data.items || [];
  const total = data.total || 0;
  const totalPages = data.pages || Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const subCounties = county
    ? regions.find((region) => region.county === county)?.subCounties || []
    : [];

  const canCreate = user?.role === 'INSPECTOR';
  const isDirector = user?.role === 'DIRECTOR';
  const isCeo = user?.role === 'CEO_REGISTRAR';
  const canReview = isDirector || isCeo;

  const directorApprove = useDirectorApprove();
  const finalApprove = useFinalApprove();
  const revertInspection = useRevertInspection();
  const returnInspection = useReturnInspection();

  const handleApprove = async (id) => {
    setApprovingId(id);
    setActionError(null);
    try {
      if (isDirector) {
        await directorApprove.mutateAsync({ id });
      } else if (isCeo) {
        await finalApprove.mutateAsync({ id });
      }
      setApprovedIds((prev) => new Set(prev).add(id));
      setApproveSuccessId(id);
      setTimeout(() => setApproveSuccessId(null), 3000);
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Approve failed. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRevert = async () => {
    if (!revertTargetId || !revertReason.trim()) return;
    setRevertingId(revertTargetId);
    setActionError(null);
    try {
      await revertInspection.mutateAsync({ id: revertTargetId, reason: revertReason.trim() });
      closeRevertDialog();
      setRevertSuccessId(revertTargetId);
      setTimeout(() => setRevertSuccessId(null), 3000);
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Revert failed. Please try again.');
    } finally {
      setRevertingId(null);
    }
  };

  const handleReturn = async () => {
    if (!returnTargetId || !returnReason.trim()) return;
    setReturningId(returnTargetId);
    setActionError(null);
    try {
      await returnInspection.mutateAsync({ id: returnTargetId, reason: returnReason.trim() });
      closeReturnDialog();
      setReturnSuccessId(returnTargetId);
      setTimeout(() => setReturnSuccessId(null), 3000);
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Return failed. Please try again.');
    } finally {
      setReturningId(null);
    }
  };

  const openReturnDialog = (id) => {
    setReturnTargetId(id);
    setReturnReason('');
    setActionError(null);
  };

  const closeReturnDialog = () => {
    setReturnTargetId(null);
    setReturnReason('');
    setActionError(null);
  };

  const openRevertDialog = (id) => {
    setRevertTargetId(id);
    setRevertReason('');
    setActionError(null);
  };

  const closeRevertDialog = () => {
    setRevertTargetId(null);
    setRevertReason('');
    setActionError(null);
  };

  return (
    <ProtectedRoute>
      <InspectionFormShell
        breadcrumb="Inspections"
        title="Inspections"
        actions={canCreate && (
          <Link href="/inspections/new" className="btn btn-primary">
            <i className="fa fa-plus" aria-hidden="true" /> New Inspection
          </Link>
        )}
      >
        <div className="inspection-filter-bar">
          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Inspection number, outlet, owner, or KVB reg. no."
            />
          </div>

          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="statusFilter">Status</label>
            <select id="statusFilter" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="countyFilter">County</label>
            <select
              id="countyFilter"
              value={county}
              onChange={(event) => { setCounty(event.target.value); setSubCounty(''); }}
            >
              <option value="">All counties</option>
              {regions.map((region) => (
                <option key={region.county} value={region.county}>{region.county}</option>
              ))}
            </select>
          </div>

          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="subCountyFilter">Sub-County</label>
            <select
              id="subCountyFilter"
              value={subCounty}
              onChange={(event) => setSubCounty(event.target.value)}
              disabled={!county}
            >
              <option value="">{county ? 'All sub-counties' : 'Select a county first'}</option>
              {subCounties.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </div>

          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="dateFrom">Date from</label>
            <input id="dateFrom" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>

          <div className="inspection-field">
            <label className="inspection-field-label" htmlFor="dateTo">Date to</label>
            <input id="dateTo" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </div>

        {error && (
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {error}
            <button type="button" className="btn btn-ghost btn-sm" onClick={refetch}>Retry</button>
          </div>
        )}

        {actionError && (
          <div className="inspection-form-error" role="alert">
            <i className="fa fa-circle-exclamation" aria-hidden="true" /> {actionError}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActionError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="inspection-form-section"><p className="inspection-loading">Loading inspections…</p></div>
        ) : items.length === 0 ? (
          <div className="inspection-form-section">
            <p className="inspection-loading">
              No inspections match these filters.
              {canCreate && <> <Link href="/inspections/new">Create a new inspection.</Link></>}
            </p>
          </div>
        ) : (
          <>
            <div className="kvb-inspections-table kvb-table-status-last">
              <div className="kvb-table-header">
                <div className="kvb-table-cell">Inspection No.</div>
                <div className="kvb-table-cell">Outlet</div>
                <div className="kvb-table-cell">County</div>
                <div className="kvb-table-cell">Date</div>
                <div className="kvb-table-cell">Compliance</div>
                <div className="kvb-table-cell">Status</div>
                {canReview && <div className="kvb-table-cell">Action</div>}
              </div>

              {items.map((inspection) => {
                const isPendingDirector = inspection.status === 'PENDING_DIRECTOR_REVIEW';
                const isPendingCeo = inspection.status === 'PENDING_CEO_REVIEW';
                const canApprove = (isDirector && isPendingDirector) || (isCeo && isPendingCeo);
                const canReturn = (isDirector && isPendingDirector) || (isCeo && isPendingCeo);
                const canRevert = isCeo && isPendingCeo;

                return (
                  <div
                    key={inspection._id}
                    className="kvb-table-row inspection-table-row"
                  >
                    <Link href={`/inspections/${inspection._id}`} className="kvb-table-cell kvb-table-id">
                      {inspection.inspectionNumber}
                    </Link>
                    <div className="kvb-table-cell">
                      {inspection.formData?.outletInformation?.outletName || inspection.outlet?.outletName || 'N/A'}
                    </div>
                    <div className="kvb-table-cell">{inspection.formData?.outletInformation?.county || 'N/A'}</div>
                    <div className="kvb-table-cell">{toDateInputValue(inspection.inspectionDate)}</div>
                    <div className="kvb-table-cell">
                      {inspection.compliance ? `${inspection.compliance.complianceRate}%` : '—'}
                    </div>
                    <div className="kvb-table-cell">
                      <StatusBadge status={inspection.status} />
                    </div>
                    {canReview && (
                      <div className="kvb-table-cell">
                        {canApprove && (
                          <>
                            {approvedIds.has(inspection._id) ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled
                                aria-label={`Approved ${inspection.inspectionNumber}`}
                              >
                                <i className="fa fa-check" aria-hidden="true" /> Approved
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleApprove(inspection._id);
                                }}
                                disabled={approvingId === inspection._id}
                                aria-label={`Approve ${inspection.inspectionNumber}`}
                              >
                                {approvingId === inspection._id ? (
                                  <span className="loading-inline">Approving…</span>
                                ) : (
                                  <>
                                    <i className="fa fa-check" aria-hidden="true" /> Approve
                                  </>
                                )}
                              </button>
                            )}
                            {approveSuccessId === inspection._id && (
                              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="approve-success-title" style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="confirm-dialog" style={{ minWidth: 'auto', padding: '24px 32px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', textAlign: 'center', border: '1px solid #dfe6df' }}>
                                  <h3 id="approve-success-title" className="confirm-title" style={{ margin: '0 0 8px', color: '#0f6b3e', fontSize: '1.125rem' }}>Inspection Approved</h3>
                                  <p className="confirm-text" style={{ margin: '0' }}>{`Inspection ${inspection.inspectionNumber} has been approved and routed to the CEO/Registrar for final review.`}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {canRevert && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-danger"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openRevertDialog(inspection._id);
                            }}
                            disabled={revertingId === inspection._id || revertingId !== null}
                            aria-label={`Revert ${inspection.inspectionNumber}`}
                          >
                            {revertingId === inspection._id ? (
                              <span className="loading-inline">Reverting…</span>
                            ) : (
                              <>
                                <i className="fa fa-undo" aria-hidden="true" /> Revert
                              </>
                            )}
                          </button>
                        )}
                        {canReturn && !canRevert && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-danger"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openReturnDialog(inspection._id);
                            }}
                            disabled={returningId === inspection._id || returningId !== null}
                            aria-label={`Return ${inspection.inspectionNumber}`}
                          >
                            {returningId === inspection._id ? (
                              <span className="loading-inline">Returning…</span>
                            ) : (
                              <>
                                <i className="fa fa-reply" aria-hidden="true" /> Return
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {returnTargetId && (
              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="return-dialog-title">
                <div className="confirm-dialog">
                  {actionError && (
                    <div className="inspection-form-error" role="alert">
                      <i className="fa fa-circle-exclamation" aria-hidden="true" /> {actionError}
                    </div>
                  )}
                  <h3 id="return-dialog-title" className="confirm-title">Return Inspection to Inspector</h3>
                  <p className="confirm-text">Provide a mandatory reason for returning this inspection to the inspector for correction.</p>
                  <div className="inspection-field">
                    <label className="inspection-field-label">Reason for Return</label>
                    <textarea
                      id="returnReason"
                      rows={3}
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                      placeholder="Enter reason for return..."
                    />
                  </div>
                  <div className="confirm-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={closeReturnDialog}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleReturn}
                      disabled={returningId !== null || !returnReason.trim()}
                    >
                      {returningId === returnTargetId ? 'Returning…' : 'Return'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {revertTargetId && (
              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="revert-dialog-title">
                <div className="confirm-dialog">
                  {actionError && (
                    <div className="inspection-form-error" role="alert">
                      <i className="fa fa-circle-exclamation" aria-hidden="true" /> {actionError}
                    </div>
                  )}
                  <h3 id="revert-dialog-title" className="confirm-title">Revert Inspection to Director</h3>
                  <p className="confirm-text">Provide a reason for reverting this inspection back to the Director for further review.</p>
                  <div className="inspection-field">
                    <label className="inspection-field-label">Reason</label>
                    <textarea
                      id="revertReason"
                      rows={3}
                      value={revertReason}
                      onChange={(event) => setRevertReason(event.target.value)}
                      placeholder="Enter reason for revert..."
                    />
                  </div>
                  <div className="confirm-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={closeRevertDialog}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleRevert}
                      disabled={revertingId !== null || !revertReason.trim()}
                    >
                      {revertingId === revertTargetId ? 'Reverting…' : 'Revert'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {returnSuccessId && (
              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="return-success-title" style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="confirm-dialog" style={{ minWidth: 'auto', padding: '24px 32px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', textAlign: 'center', border: '1px solid #dfe6df' }}>
                  <h3 id="return-success-title" className="confirm-title" style={{ margin: '0 0 8px', color: '#0f6b3e', fontSize: '1.125rem' }}>Inspection Returned</h3>
                  <p className="confirm-text" style={{ margin: '0' }}>{`Inspection ${returnSuccessId} has been returned to the inspector for correction.`}</p>
                </div>
              </div>
            )}

            {revertSuccessId && (
              <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="revert-success-title" style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="confirm-dialog" style={{ minWidth: 'auto', padding: '24px 32px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', textAlign: 'center', border: '1px solid #dfe6df' }}>
                  <h3 id="revert-success-title" className="confirm-title" style={{ margin: '0 0 8px', color: '#0f6b3e', fontSize: '1.125rem' }}>Inspection Reverted</h3>
                  <p className="confirm-text" style={{ margin: '0' }}>{`Inspection ${revertSuccessId} has been reverted to the Director for further review.`}</p>
                </div>
              </div>
            )}

            <nav className="inspection-pagination" aria-label="Inspection pages">
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
          </>
        )}
      </InspectionFormShell>
    </ProtectedRoute>
  );
}
