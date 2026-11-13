import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import toast from 'react-hot-toast';

// Animated count-up number
export const CountUp = ({ to, duration = 1.1 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const end = parseInt(to, 10) || 0;
    if (end === 0) { setVal(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span>{val}</span>;
};

export const KpiCard = ({ icon: Icon, label, value, sub, accent = false }) => (
  <div className={`card-base card-hover p-3.5 sm:p-5 flex flex-col justify-between ${accent ? 'bg-accent text-white' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${accent ? 'opacity-90' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
      {Icon && (
        <span className={`p-1.5 rounded-lg shrink-0 ${accent ? 'bg-white/20' : 'bg-[var(--accent-soft)] text-accent'}`}>
          <Icon size={15} />
        </span>
      )}
    </div>
    <div className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${accent ? 'text-white' : 'text-[var(--text-main)]'}`}>
      <CountUp to={value} />
    </div>
    {sub && <div className={`text-[10px] sm:text-[11px] mt-1.5 truncate ${accent ? 'opacity-90' : 'text-[var(--text-muted)]'}`}>{sub}</div>}
  </div>
);

export const SectionCard = ({ title, action, children, className = '' }) => (
  <div className={`card-base p-4 sm:p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-[var(--text-main)]">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// Compact task row used by dashboard lists
export const TaskRow = ({ task, right, onClick, onDelete }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onClick}
      className="flex-1 min-w-0 flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--border-card)] hover:border-accent text-left transition-colors"
    >
      <div className="min-w-0">
        <span className={`block text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-[var(--text-main)]'}`}>
          {task.title}
        </span>
        <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
          {task.backendStatus}{task.deadline ? ` · Due ${task.deadline}` : ''}
        </span>
      </div>
      {right}
    </button>
    {onDelete && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
        title="Delete task"
        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
);

const FOCUS_KEY = 'flowzen_focus_ends_at';
const FOCUS_LEN = 25 * 60; // 25 minutes

const fmt = (secs) => {
  const m = Math.floor(Math.max(0, secs) / 60).toString().padStart(2, '0');
  const s = (Math.max(0, secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// End-time based focus timer — survives reloads via localStorage.
export const FocusTimer = ({ onComplete }) => {
  const { playClick, playTimer, playSuccess } = useSound();
  const [endsAt, setEndsAt] = useState(() => {
    const saved = Number(localStorage.getItem(FOCUS_KEY));
    return saved && saved > Date.now() ? saved : null;
  });
  const [now, setNow] = useState(Date.now());
  const finishedRef = useRef(false);

  const running = !!endsAt && endsAt > now;
  const remaining = endsAt ? Math.max(0, Math.round((endsAt - now) / 1000)) : FOCUS_LEN;

  useEffect(() => {
    if (!endsAt) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [endsAt]);

  useEffect(() => {
    if (endsAt && endsAt <= now && !finishedRef.current) {
      finishedRef.current = true;
      setEndsAt(null);
      localStorage.removeItem(FOCUS_KEY);
      playSuccess();
      toast.success('Focus session complete!');
      onComplete?.();
    }
  }, [endsAt, now, onComplete, playSuccess]);

  const start = () => {
    playTimer(true);
    finishedRef.current = false;
    const end = Date.now() + FOCUS_LEN * 1000;
    setEndsAt(end);
    localStorage.setItem(FOCUS_KEY, String(end));
    setNow(Date.now());
  };

  const pause = () => {
    playTimer(false);
    if (endsAt) {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setEndsAt(null);
      localStorage.removeItem(FOCUS_KEY);
      // store paused remainder so Start resumes rather than resets
      localStorage.setItem('flowzen_focus_paused', String(left));
    }
  };

  const reset = () => {
    playClick();
    setEndsAt(null);
    localStorage.removeItem(FOCUS_KEY);
    localStorage.removeItem('flowzen_focus_paused');
  };

  // Resume a paused session if present
  const resume = () => {
    const left = Number(localStorage.getItem('flowzen_focus_paused'));
    if (left > 0) {
      playTimer(true);
      finishedRef.current = false;
      const end = Date.now() + left * 1000;
      setEndsAt(end);
      localStorage.setItem(FOCUS_KEY, String(end));
      localStorage.removeItem('flowzen_focus_paused');
      setNow(Date.now());
    } else {
      start();
    }
  };

  const paused = !running && Number(localStorage.getItem('flowzen_focus_paused')) > 0;

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-slate-900 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock size={14} className="text-accent" /> Deep Work Focus
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-accent text-[10px] font-bold">25:00</span>
      </div>
      <div className="my-4 text-center">
        <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider tabular-nums">
          {fmt(remaining)}
        </span>
        <p className="text-[11px] text-slate-400 mt-1">
          {running ? 'Focus session in progress' : paused ? 'Paused — ready to resume' : 'Ready to start'}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        {running ? (
          <button
            onClick={pause}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button
            onClick={paused ? resume : start}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-accent hover:opacity-90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Play size={14} /> {paused ? 'Resume' : 'Start Focus'}
          </button>
        )}
        <button
          onClick={reset}
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
};
