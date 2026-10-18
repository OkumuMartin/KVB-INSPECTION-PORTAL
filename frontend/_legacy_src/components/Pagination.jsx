export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit) || 1;
  const pages = [];

  const maxPages = 5;
  let start = Math.max(1, page - Math.floor(maxPages / 2));
  let end = Math.min(totalPages, start + maxPages - 1);

  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages <= 0) return null;

  return (
    <div className="action-row" style={{ justifyContent: 'center' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>

      {start > 1 && <span className="kvb-muted" style={{ padding: '0 0.5rem', fontSize: 13 }}>...</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && <span className="kvb-muted" style={{ padding: '0 0.5rem', fontSize: 13 }}>...</span>}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
