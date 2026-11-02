import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="flowzen-dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          solid: 'var(--brand-solid)',
          rose: 'var(--brand-rose)',
          violet: 'var(--brand-violet)',
          teal: 'var(--brand-teal)',
          gold: 'var(--brand-gold)',
        },
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-contrast': 'var(--accent-contrast)',
        'accent-hover': 'var(--accent-hover)',
        rose: {
          primary: 'var(--brand-solid)',
          hover: 'var(--accent-hover)',
          light: 'var(--brand-rose)',
          deep: 'var(--brand-solid)',
          soft: 'var(--accent-soft)',
        },
        butter: {
          yellow: 'var(--brand-gold)',
        },
        zen: {
          textDark: 'var(--text-main)',
          textLight: 'var(--text-main)',
          muted: 'var(--text-muted)',
        }
      },
      zIndex: {
        'cursor-glow': 'var(--z-cursor-glow)',
        'content': 'var(--z-content)',
        'sticky-nav': 'var(--z-sticky-nav)',
        'dropdown': 'var(--z-dropdown)',
        'modal': 'var(--z-modal)',
        'toast': 'var(--z-toast)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': 'var(--surface-card-shadow)',
        'glass-hover': 'var(--shadow-card-hover)',
        'rose-glow': '0 0 24px rgba(232, 120, 154, 0.35)',
      },
      backdropBlur: {
        'xl': '20px',
      },
      borderRadius: {
        'zen': '20px',
        'zen-lg': '24px',
      }
    },
  },
  plugins: [
    daisyui
  ],
  daisyui: {
    themes: [
      {
        'flowzen-light': {
          "primary": "#C2456F",
          "primary-content": "#FFFFFF",
          "secondary": "#8B5CF6",
          "accent": "#E8789A",
          "neutral": "#2A1F26",
          "base-100": "#FFEFF5",
          "base-200": "#F3EBF0",
          "base-300": "#E9DFE5",
          "info": "#2DD4BF",
          "success": "#34D399",
          "warning": "#F6C177",
          "error": "#F43F5E",
        },
        'flowzen-dark': {
          "primary": "#C2456F",
          "primary-content": "#FFFFFF",
          "secondary": "#8B5CF6",
          "accent": "#E8789A",
          "neutral": "#FDF9FB",
          "base-100": "#09060F",
          "base-200": "#14101E",
          "base-300": "#1B1626",
          "info": "#2DD4BF",
          "success": "#34D399",
          "warning": "#F6C177",
          "error": "#F43F5E",
        }
      }
    ],
    darkTheme: "flowzen-dark",
    base: true,
    styled: true,
    utils: true,
  }
}
