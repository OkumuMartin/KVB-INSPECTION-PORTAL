const statusLabels = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Director Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

export function StatusBadge({ status, showLabel = true }) {
  const label = statusLabels[status] || status;
  return (
    <span className={`status-badge ${status}`}>
      {showLabel ? label : ''}
    </span>
  );
}

export function StatusBadgeCompact({ status }) {
  const label = statusLabels[status] || status;
  return <span className={`status-badge ${status}`}>{label}</span>;
}

export const STATUS_LABELS = statusLabels;

export default StatusBadge;
