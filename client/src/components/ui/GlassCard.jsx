import React from 'react';

/**
 * Reusable GlassCard component
 * Complies with STEP 1 Glass tokens:
 * - dark: bg rgba(255,255,255,.06), border rgba(255,255,255,.12), blur 16-24px, inner top highlight
 * - light: bg rgba(255,255,255,.65), border rgba(255,255,255,.8), soft rose shadow
 * - WCAG AA text contrast
 */
export default function GlassCard({
  children,
  className = '',
  variant = 'default', // 'default' | 'strong'
  hover = true,
  onClick,
  ...props
}) {
  const baseClass = variant === 'strong' ? 'glass-strong' : 'glass';
  const hoverClass = hover 
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover' 
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${baseClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
