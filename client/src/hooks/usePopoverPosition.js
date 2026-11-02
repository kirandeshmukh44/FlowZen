import { useState, useCallback, useEffect } from 'react';

export function usePopoverPosition(triggerRefOrOptions, isOpenOrAlign = false, maybeOptions = {}) {
  const isRef = triggerRefOrOptions && typeof triggerRefOrOptions === 'object' && 'current' in triggerRefOrOptions;

  let triggerRef = null;
  let isOpen = false;
  let options = {};

  if (isRef) {
    triggerRef = triggerRefOrOptions;
    isOpen = typeof isOpenOrAlign === 'boolean' ? isOpenOrAlign : false;
    options = maybeOptions || {};
  } else {
    options = triggerRefOrOptions || {};
  }

  const offset = options.offset ?? 8;
  const align = options.align ?? 'right';

  const [popoverStyle, setPopoverStyle] = useState({
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 'var(--z-dropdown, 60)',
  });

  const updatePosition = useCallback(() => {
    const el = triggerRef ? triggerRef.current : null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopoverStyle({
      position: 'fixed',
      top: rect.bottom + offset + 'px',
      ...(align === 'right'
        ? { right: Math.max(12, window.innerWidth - rect.right) + 'px' }
        : { left: Math.max(12, rect.left) + 'px' }),
      zIndex: 'var(--z-dropdown, 60)',
    });
  }, [triggerRef, offset, align]);

  useEffect(() => {
    updatePosition();
    const h = () => updatePosition();
    window.addEventListener('resize', h);
    window.addEventListener('scroll', h, true);
    return () => {
      window.removeEventListener('resize', h);
      window.removeEventListener('scroll', h, true);
    };
  }, [triggerRef, updatePosition, isOpen]);

  const triggerRefCallback = useCallback((node) => {
    if (triggerRef) triggerRef.current = node;
  }, [triggerRef]);

  return isRef
    ? { popoverStyle, updatePosition }
    : { triggerRef: triggerRefCallback, popoverStyle, updatePosition };
}

export default usePopoverPosition;