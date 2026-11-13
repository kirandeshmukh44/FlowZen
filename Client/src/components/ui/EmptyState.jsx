import React from 'react';
import { Link } from 'react-router-dom';

// Consistent empty state: icon + one-line explanation + optional CTA.
const EmptyState = ({ icon: Icon, title, hint, ctaLabel, ctaTo, onCta, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}>
    {Icon && <Icon size={30} className="text-[var(--text-muted)] opacity-50 mb-2" />}
    <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
    {hint && <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">{hint}</p>}
    {ctaLabel && (ctaTo ? (
      <Link
        to={ctaTo}
        className="mt-3 px-4 py-2 min-h-[44px] inline-flex items-center rounded-xl bg-accent text-white text-xs font-bold hover:opacity-95 transition-opacity"
      >
        {ctaLabel}
      </Link>
    ) : (
      <button
        onClick={onCta}
        className="mt-3 px-4 py-2 min-h-[44px] rounded-xl bg-accent text-white text-xs font-bold hover:opacity-95 transition-opacity"
      >
        {ctaLabel}
      </button>
    ))}
  </div>
);

export default EmptyState;
