export default function ProgressBar({ steps, currentStep, onStepClick }) {
  return (
    <div className="progress-panel">
      <div className="stepper">
        {steps.map((label, index) => {
          const isPast = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          let className = 'step';
          if (isCurrent) className += ' active';
          if (isPast && !isCurrent) className += ' complete';

          return (
            <button
              key={label}
              type="button"
              className={className}
              onClick={() => onStepClick && onStepClick(index)}
              disabled={isFuture}
              style={{ fontSize: '0.72rem', cursor: isFuture ? 'default' : 'pointer' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                     background: isCurrent ? 'var(--kvb-green)' : isPast ? 'var(--kvb-green-soft)' : 'transparent',
                     border: `2px solid ${isPast ? 'var(--kvb-green-soft)' : isCurrent ? 'var(--kvb-green)' : 'var(--kvb-border)'}`,
                     color: isPast || isCurrent ? 'white' : 'var(--kvb-muted)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {isPast ? '✓' : index + 1}
                </span>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
