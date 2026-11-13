import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppearance } from '../../context/AppearanceContext';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useAppearance();
  const isDark = theme === 'flowzen-dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ${className}`}
      style={{ backgroundColor: isDark ? 'var(--surface-nav)' : 'var(--accent-soft)' }}
    >
      <span className="sr-only">Toggle Theme</span>
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full shadow-md transform transition-transform duration-300 ${
          isDark ? 'translate-x-7 text-amber-300' : 'translate-x-0 text-[var(--accent)]'
        }`}
        style={{ backgroundColor: 'var(--surface-card)' }}
      >
        {isDark ? <Moon size={15} /> : <Sun size={15} />}
      </div>
    </button>
  );
};

export default ThemeToggle;

