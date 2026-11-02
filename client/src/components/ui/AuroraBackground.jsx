import React from 'react';

/**
 * AuroraBackground
 * Subtle animated ambient light blobs for the luxury glassmorphism background.
 */
export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Rose Aurora Blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 dark:opacity-20 animate-aurora-blob-1"
        style={{
          top: '-10%',
          right: '5%',
          background: 'radial-gradient(circle, var(--brand-rose, #E8789A) 0%, transparent 70%)',
        }}
      />

      {/* Violet Aurora Blob */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 dark:opacity-15 animate-aurora-blob-2"
        style={{
          bottom: '-15%',
          left: '10%',
          background: 'radial-gradient(circle, var(--brand-violet, #8B5CF6) 0%, transparent 70%)',
        }}
      />

      {/* Teal Accent Aurora Blob */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[130px] opacity-15 dark:opacity-10 animate-aurora-blob-3"
        style={{
          top: '35%',
          left: '40%',
          background: 'radial-gradient(circle, var(--brand-teal, #2DD4BF) 0%, transparent 70%)',
        }}
      />

      {/* Warm Champagne/Gold Aurora Glow (Bottom-Right, matches master reference #FBF3DC) */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-30 dark:opacity-10 animate-aurora-blob-1"
        style={{
          bottom: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, var(--brand-gold, #F6C177) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

export default AuroraBackground;

