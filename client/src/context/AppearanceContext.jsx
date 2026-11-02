import React, { createContext, useContext, useState, useEffect } from 'react';

const AppearanceContext = createContext(null);

export const ACCENT_PRESETS = {
  rose: {
    id: 'rose',
    name: 'Rose Orchid',
    color: '#C2456F', // --brand-solid #C2456F (white text AA contrast)
    rose: '#E8789A',
    violet: '#8B5CF6',
    gold: '#F6C177',
    soft: 'rgba(194, 69, 111, 0.12)',
    contrast: '#FFFFFF',
    hover: '#AC385E',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    color: '#2563EB',
    rose: '#60A5FA',
    violet: '#818CF8',
    gold: '#F6C177',
    soft: 'rgba(37, 99, 235, 0.12)',
    contrast: '#FFFFFF',
    hover: '#1D4ED8',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    color: '#059669',
    rose: '#34D399',
    violet: '#6EE7B7',
    gold: '#F6C177',
    soft: 'rgba(5, 150, 105, 0.12)',
    contrast: '#FFFFFF',
    hover: '#047857',
  },
  plum: {
    id: 'plum',
    name: 'Plum',
    color: '#7C3AED',
    rose: '#A78BFA',
    violet: '#C084FC',
    gold: '#F6C177',
    soft: 'rgba(124, 58, 237, 0.12)',
    contrast: '#FFFFFF',
    hover: '#6D28D9',
  },
};

export const AppearanceProvider = ({ children }) => {
  const [accent, setAccentState] = useState(() => {
    try {
      const saved = localStorage.getItem('flowzen_accent');
      return ACCENT_PRESETS[saved] ? saved : 'rose';
    } catch (e) {
      return 'rose';
    }
  });

  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('flowzen_theme') || 'flowzen-dark';
    } catch (e) {
      return 'flowzen-dark';
    }
  });

  const [weekStartsOn, setWeekStartsOnState] = useState(() => {
    try {
      return localStorage.getItem('flowzen_week_start') || 'monday';
    } catch (e) {
      return 'monday';
    }
  });

  // Apply CSS variables and theme to documentElement
  useEffect(() => {
    const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.rose;
    const root = document.documentElement;

    // Brand tokens
    root.style.setProperty('--brand-solid', preset.color);
    root.style.setProperty('--brand-rose', preset.rose || '#E8789A');
    root.style.setProperty('--brand-violet', preset.violet || '#8B5CF6');
    root.style.setProperty('--brand-gold', '#F6C177');

    // Accent variables driven by the same system
    root.style.setProperty('--accent', preset.color);
    root.style.setProperty('--accent-soft', preset.soft);
    root.style.setProperty('--accent-contrast', preset.contrast);
    root.style.setProperty('--accent-hover', preset.hover);

    root.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'flowzen-dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#09060F';
      if (document.body) document.body.style.backgroundColor = '#09060F';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#09060F');
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#FDF3F5';
      if (document.body) document.body.style.backgroundColor = '#FDF3F5';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#FDF3F5');
    }

    try {
      localStorage.setItem('flowzen_accent', accent);
      localStorage.setItem('flowzen_theme', theme);
      localStorage.setItem('flowzen_week_start', weekStartsOn);
    } catch (e) {}
  }, [accent, theme, weekStartsOn]);

  const setAccent = (presetId) => {
    if (ACCENT_PRESETS[presetId]) {
      setAccentState(presetId);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'flowzen-light' ? 'flowzen-dark' : 'flowzen-light'));
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const setWeekStartsOn = (day) => {
    setWeekStartsOnState(day);
  };

  return (
    <AppearanceContext.Provider
      value={{
        accent,
        accentPreset: ACCENT_PRESETS[accent] || ACCENT_PRESETS.rose,
        presets: ACCENT_PRESETS,
        setAccent,
        theme,
        isDark: theme === 'flowzen-dark',
        toggleTheme,
        setTheme,
        weekStartsOn,
        setWeekStartsOn,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

export default useAppearance;

