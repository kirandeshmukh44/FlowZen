import React from 'react';

export default function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
  ringOnly = false
}) {
  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-sm', f: 'text-[11px]' },
    sm: { box: 'w-8 h-8', text: 'text-base', f: 'text-xs' },
    md: { box: 'w-9 h-9', text: 'text-lg', f: 'text-sm' },
    lg: { box: 'w-11 h-11', text: 'text-2xl', f: 'text-base' },
    xl: { box: 'w-16 h-16', text: 'text-3xl', f: 'text-2xl' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const iconElement = (
    <div
      className={`relative ${currentSize.box} rounded-xl flex items-center justify-center shrink-0 select-none shadow-sm overflow-hidden bg-gradient-to-br from-rose-500/15 via-purple-500/10 to-transparent border border-white/20 backdrop-blur-md group-hover:scale-105 transition-transform duration-200`}
    >
      {/* Wave-line ring spinning slowly */}
      <img
        src="/ring.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain p-0.5 animate-[spin_12s_linear_infinite] opacity-90"
      />
      {/* Centered crisp 'F' */}
      <span
        aria-hidden="true"
        className={`relative z-10 font-black font-sans tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] ${currentSize.f}`}
      >
        F
      </span>
    </div>
  );

  if (ringOnly) return iconElement;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {iconElement}
      {showText && (
        <div className={`font-extrabold tracking-tight font-sans leading-none ${currentSize.text} ${textClassName}`}>
          <span style={{ color: 'var(--text-main)', WebkitTextFillColor: 'var(--text-main)' }} className="transition-colors">Flow</span>
          <span
            style={{
              background: 'linear-gradient(135deg, var(--brand-rose), var(--brand-violet))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'var(--brand-rose)',
            }}
          >
            Zen
          </span>
        </div>
      )}
    </div>
  );
}

