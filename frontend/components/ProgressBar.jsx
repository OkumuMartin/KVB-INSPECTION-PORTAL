'use client';

export default function ProgressBar({ current = 1, total = 4, onStepClick }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="stepper">
      {steps.map((step) => {
        const isComplete = step < current;
        const isActive = step === current;
        const stepClass = isComplete ? 'step complete' : isActive ? 'step active' : 'step';
        return (
          <button
            key={step}
            type="button"
            className={stepClass}
            onClick={() => onStepClick && onStepClick(step)}
            disabled={!onStepClick}
          >
            {step}
          </button>
        );
      })}
    </div>
  );
}
