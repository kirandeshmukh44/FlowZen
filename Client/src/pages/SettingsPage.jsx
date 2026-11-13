import React from 'react';
import {
  Palette,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Calendar as CalendarIcon,
  Check,
  Sparkles
} from 'lucide-react';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { accent, presets, setAccent, theme, isDark, toggleTheme, weekStartsOn, setWeekStartsOn } = useAppearance();
  const { isMuted, setIsMuted, volume, setVolume, playClick, playToggle, playSuccess, playLevelUp } = useSound();

  const handleAccentChange = (presetKey) => {
    playClick();
    setAccent(presetKey);
    toast.success(`Theme accent updated to ${presets[presetKey]?.name}`);
  };

  const handleThemeToggle = () => {
    playToggle(!isDark);
    toggleTheme();
  };

  const handleTestSound = () => {
    playSuccess();
    toast.success('Sound test executed successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Customize your visual appearance, auditory feedback, and calendar schedule.
        </p>
      </div>

      {/* ===================== SECTION 1: APPEARANCE & ACCENT ===================== */}
      <div className="card-base p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
          <Palette size={18} className="text-accent" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Accent Color & Theme</h2>
            <p className="text-xs text-[var(--text-muted)]">Applied app-wide instantly across all cards and controls</p>
          </div>
        </div>

        {/* Accent Swatches */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Primary Accent Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(presets).map((preset) => {
              const isSelected = accent === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleAccentChange(preset.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'border-accent bg-[var(--accent-soft)] shadow-xs ring-2 ring-accent'
                      : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-5 h-5 rounded-full shadow-xs" 
                      style={{ backgroundColor: preset.color }}
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-main)] block">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {preset.color}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-accent" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark / Light Toggle */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[var(--text-main)] block">Interface Mode</span>
            <span className="text-xs text-[var(--text-muted)]">Choose between high-contrast crisp light or calm dark</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)]">
            <button
              onClick={() => {
                if (isDark) handleThemeToggle();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isDark ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sun size={14} className="text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => {
                if (!isDark) handleThemeToggle();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDark ? 'bg-slate-800 text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Moon size={14} className="text-slate-300" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== SECTION 2: SOUND SYSTEM ===================== */}
      <div className="card-base p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
          <Volume2 size={18} className="text-accent" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Auditory Feedback (Web Audio API)</h2>
            <p className="text-xs text-[var(--text-muted)]">Subtle synthesized UI micro-sounds for interactions and celebrations</p>
          </div>
        </div>

        {/* Sound Enable / Mute Switch */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-main)] block">Master UI Audio</span>
            <span className="text-xs text-[var(--text-muted)]">Play sound ticks on buttons, task completions, and transitions</span>
          </div>

          <button
            onClick={() => {
              playToggle(!isMuted);
              setIsMuted(!isMuted);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              !isMuted ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                !isMuted ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-muted)]">Sound Volume</span>
            <span className="text-accent font-bold">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-4">
            <VolumeX size={16} className="text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="flex-1 h-2 rounded-lg cursor-pointer disabled:opacity-40"
            />
            <Volume2 size={16} className="text-accent" />
          </div>
        </div>

        {/* Test Sound Button */}
        <div className="pt-2">
          <button
            onClick={handleTestSound}
            className="px-4 py-2 rounded-xl border border-[var(--border-card)] hover:border-accent text-xs font-semibold text-[var(--text-main)] transition-colors flex items-center gap-2"
          >
            <Sparkles size={14} className="text-accent" />
            <span>Test UI Sound</span>
          </button>
        </div>
      </div>

      {/* ===================== SECTION 3: CALENDAR PREFERENCES ===================== */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
          <CalendarIcon size={18} className="text-accent" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Calendar & Scheduling</h2>
            <p className="text-xs text-[var(--text-muted)]">Configure how week days and sprints are structured</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-main)] block">Week Starts On</span>
            <span className="text-xs text-[var(--text-muted)]">Default day for monthly calendar grids and timelines</span>
          </div>

          <div className="flex items-center gap-2">
            {['monday', 'sunday'].map((day) => (
              <button
                key={day}
                onClick={() => {
                  playClick();
                  setWeekStartsOn(day);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  weekStartsOn === day
                    ? 'bg-accent text-white border-accent'
                    : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;

