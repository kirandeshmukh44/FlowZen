import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal
 * Safely renders children directly into document.body or container.
 */
export function Portal({ children, container }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const target = container || document.body;
  return createPortal(children, target);
}

export default Portal;

