'use client';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Director Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

export default function StatusBadge({ status, showIcon = false }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`status-badge ${status}`}>
      {showIcon && <span style={{ marginRight: 4 }}>●</span>}
      {label}
    </span>
  );
}
