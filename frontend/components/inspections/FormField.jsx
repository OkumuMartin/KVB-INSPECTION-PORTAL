'use client';

export function FormField({ id, label, error, required = false, hint, full = false, children }) {
  return (
    <div className={`inspection-field${full ? ' inspection-field-full' : ''}`}>
      <label className="inspection-field-label" htmlFor={id}>
        {label}
        {required && <span className="inspection-required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="inspection-field-hint">{hint}</p>}
      {error && (
        <p className="inspection-field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({ number, title, description, children }) {
  return (
    <section className="inspection-form-section" aria-labelledby={`section-${number}`}>
      <div className="inspection-section-header">
        {number && <div className="inspection-section-number">{number}</div>}
        <div>
          <h2 id={`section-${number}`}>{title}</h2>
          {description && <p className="inspection-section-description">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Checkbox({ id, label, checked, onChange, disabled = false, describedBy }) {
  return (
    <div className="inspection-checkbox">
      <input
        id={id}
        className="form-check-input"
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-describedby={describedBy}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
