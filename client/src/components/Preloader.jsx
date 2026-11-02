import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'flowzen_preloader_shown';

const MICRO_COPIES = [
  'Syncing workspace...',
  'Calibrating AI scorer...',
  'Optimizing task streams...',
  'Entering FlowZen...'
];

function getHasShown() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setHasShown() {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export default function Preloader() {
  const [mounted, setMounted] = useState(() => !getHasShown());
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(20);
  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    if (!mounted) return;

    let progressTimer;
    let copyTimer;
    let dismissTimer;

    // Increment progress bar smoothly
    progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return Math.min(prev + Math.floor(Math.random() * 15) + 10, 95);
      });
    }, 150);

    // Cycle micro-copy
    copyTimer = setInterval(() => {
      setCopyIndex((prev) => (prev + 1) % MICRO_COPIES.length);
    }, 280);

    // Strict timing clamp: 900ms minimum display, then smoothly fade out over 300ms
    dismissTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setHasShown();
          setMounted(false);
        }, 300); // 300ms smooth fade duration
      }, 80);
    }, 900);

    return () => {
      clearInterval(progressTimer);
      clearInterval(copyTimer);
      clearTimeout(dismissTimer);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`preloader-overlay ${isFading ? 'fade-out' : ''}`}
      role="status"
      aria-label="Loading FlowZen"
    >
      {/* Centered Logo on Glass Disc */}
      <div className="preloader-logo-box">
        <div className="preloader-glass-disc" />
        <img
          src="/ring.png"
          alt="FlowZen Waveform Ring"
          className="preloader-ring"
        />
        <div className="preloader-f" aria-hidden="true" />
      </div>

      {/* Brand Typography */}
      <div className="preloader-title" aria-label="FlowZen">
        <span className="preloader-flow">Flow</span>
        <span className="preloader-zen">Zen</span>
      </div>

      {/* Thin Brand Gradient Progress Bar */}
      <div className="preloader-progress-track">
        <div
          className="preloader-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Cycling Micro-copy */}
      <div className="preloader-status" aria-live="polite">
        {MICRO_COPIES[copyIndex]}
      </div>
    </div>
  );
}
