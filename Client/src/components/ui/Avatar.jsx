import React, { useEffect, useState } from 'react';

// Avatar with initials fallback — never renders a broken image.
const Avatar = ({ name = '', src, size = 36, className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

  const px = typeof size === 'number' ? `${size}px` : size;

  if (!src || failed) {
    return (
      <div
        className={`rounded-full bg-[var(--accent-soft)] text-accent font-bold flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: px, height: px, fontSize: `calc(${px} * 0.38)` }}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: px, height: px }}
    />
  );
};

export default Avatar;
