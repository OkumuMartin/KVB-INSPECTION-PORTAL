'use client';

export default function StepIndicator({ steps, currentIndex, furthestIndex, onSelect }) {
  return (
    <nav className="inspection-stepper" aria-label="Inspection form progress">
      <ol className="inspection-stepper-list">
        {steps.map((step, index) => {
          const state = index === currentIndex ? 'active' : index < furthestIndex ? 'complete' : 'upcoming';
          const reachable = index <= furthestIndex;

          return (
            <li key={step.id} className="inspection-stepper-item">
              <button
                type="button"
                className={`inspection-stepper-step ${state}`}
                onClick={() => reachable && onSelect(index)}
                disabled={!reachable}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className="inspection-stepper-marker" aria-hidden="true">
                  {state === 'complete' ? <i className="fa fa-check" /> : index + 1}
                </span>
                <span className="inspection-stepper-label">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={`inspection-stepper-connector${index < currentIndex ? ' complete' : ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
