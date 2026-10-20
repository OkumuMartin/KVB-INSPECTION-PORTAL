'use client';

import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, ready, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`lp-theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={ready ? isDark : undefined}
    >
      <span className="lp-theme-toggle-track" aria-hidden="true">
        <span className="lp-theme-toggle-thumb">
          <i className={`fa ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
        </span>
      </span>
      <span className="lp-theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
