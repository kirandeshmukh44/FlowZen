import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders, Sparkles, Check, RotateCcw, Info, ChevronDown, ChevronUp,
  CalendarClock, ArrowRight,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import { rankOpenTasks } from '../lib/metrics';
import { scopeTasksForRole } from '../lib/metrics';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const DEFAULT_WEIGHTS = { importance: 70, urgency: 80, effort: 35 };

export const AIPrioritizerPage = () => {
  const { tasks, weights, updateWeight, teamMembers } = useTasks();
  const { user } = useAuth();
  const { playClick, playSuccess } = useSound();
  const [expandedId, setExpandedId] = useState(null);

  // Role-scoped open tasks ranked by the live weights.
  const ranked = useMemo(() => {
    const scoped = scopeTasksForRole(tasks, { user, teamMembers });
    return rankOpenTasks(scoped, weights);
  }, [tasks, weights, user, teamMembers]);

  const handleReset = () => {
    playClick();
    updateWeight('importance', DEFAULT_WEIGHTS.importance);
    updateWeight('urgency', DEFAULT_WEIGHTS.urgency);
    updateWeight('effort', DEFAULT_WEIGHTS.effort);
    toast.success('Weights reset to 70/80/35');
  };

  const handleApplyAll = () => {
    playSuccess();
    // Weights are already persisted per-user by updateWeight; flag the
    // Kanban board to default-sort by AI score.
    if (user?.id) {
      try { localStorage.setItem(`flowzen_kanban_sort_${user.id}`, 'aiScore'); } catch (e) {}
    }
    toast.success('Weights applied — Kanban now sorts by AI score');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            AI Priority Calibration
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tune weights to re-rank your open tasks. Scores update live; "Apply" persists them and sorts the Kanban board.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-[var(--border-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--text-main)] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={14} aria-hidden /> Reset
          </button>
          <button
            onClick={handleApplyAll}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Check size={14} aria-hidden /> Apply to Sprints
          </button>
        </div>
      </div>

      {/* Formula Card Banner */}
      <div className="card-base p-4 sm:p-6 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-card)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>Scoring Formula</span>
            </div>
            <div className="font-mono text-xs sm:text-sm md:text-base font-extrabold text-[var(--text-main)] break-words leading-relaxed">
              Score = normalize( W<sub>i</sub>·Importance + W<sub>u</sub>·Urgency − W<sub>e</sub>·Effort )
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-1.5">
              Importance 1–10 from the task, Urgency derived from deadline proximity, Effort in hours (lower is better). Equal scores break by earlier deadline, then higher importance.
            </p>
          </div>

          <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl card-base bg-[var(--bg-card)] text-center shrink-0 self-start sm:self-auto">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider block">Open Tasks Scored</span>
            <span className="text-xl sm:text-2xl font-black text-accent">{ranked.length}</span>
          </div>
        </div>
      </div>

      {/* Sliders Panel & Live Priority Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* Sliders Controller */}
        <div className="card-base p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Weight Sliders</h3>
            <p className="text-xs text-[var(--text-muted)]">Changes re-rank the queue instantly and are saved to your account.</p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <label htmlFor="w-importance" className="text-[var(--text-main)]">Importance Weight (W<sub>i</sub>)</label>
                <span className="text-accent font-bold" aria-live="polite">{weights.importance} / 100</span>
              </div>
              <input
                id="w-importance"
                type="range" min="0" max="100" value={weights.importance}
                onChange={(e) => updateWeight('importance', e.target.value)}
                aria-label="Importance weight"
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">How much a task's strategic importance moves it up the queue.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <label htmlFor="w-urgency" className="text-[var(--text-main)]">Urgency Weight (W<sub>u</sub>)</label>
                <span className="text-accent font-bold" aria-live="polite">{weights.urgency} / 100</span>
              </div>
              <input
                id="w-urgency"
                type="range" min="0" max="100" value={weights.urgency}
                onChange={(e) => updateWeight('urgency', e.target.value)}
                aria-label="Urgency weight"
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Penalty scaling for tasks nearing their deadline.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <label htmlFor="w-effort" className="text-[var(--text-main)]">Effort Discount (W<sub>e</sub>)</label>
                <span className="text-accent font-bold" aria-live="polite">{weights.effort} / 100</span>
              </div>
              <input
                id="w-effort"
                type="range" min="0" max="100" value={weights.effort}
                onChange={(e) => updateWeight('effort', e.target.value)}
                aria-label="Effort discount weight"
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Preference for quick-win, low-effort deliverables.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] text-xs text-[var(--text-muted)] flex items-start gap-2">
            <Info size={16} className="text-accent shrink-0 mt-0.5" aria-hidden />
            <span>Only open tasks are ranked — completed and cancelled tasks are excluded.</span>
          </div>
        </div>

        {/* Ranked queue */}
        <div className="md:col-span-2 card-base p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">Ranked Queue</h3>
              <p className="text-xs text-[var(--text-muted)]">Sorted by score; ties break by deadline then importance.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-soft)] text-accent">
              {ranked.length} open
            </span>
          </div>

          {ranked.length === 0 ? (
            <EmptyState
              icon={Sliders}
              title="No open tasks to rank"
              hint="Create a task and it will appear here, scored by the weights above."
              ctaLabel="Create your first task"
              ctaTo="/tasks"
            />
          ) : (
            <div className="space-y-2.5">
              {ranked.map(({ task, score, contributions, estimated }, index) => {
                const expanded = expandedId === task.id;
                return (
                  <div
                    key={task.id}
                    className="rounded-xl bg-white dark:bg-slate-900/60 border border-[var(--border-card)] shadow-2xs hover:border-accent transition-all"
                  >
                    <button
                      onClick={() => { playClick(); setExpandedId(expanded ? null : task.id); }}
                      className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                      aria-expanded={expanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-accent text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--text-main)] truncate">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><CalendarClock size={11} /> Due {task.deadline || '—'}</span>
                            <span>·</span>
                            <span>Importance {task.importance}/10</span>
                            <span>·</span>
                            <span>Effort {task.effort}h</span>
                            {estimated && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[9px] font-bold">estimated</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <span className="text-base font-black text-accent">{score}</span>
                          <span className="block text-[9px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Score</span>
                        </div>
                        {expanded ? <ChevronUp size={15} className="text-[var(--text-muted)]" /> : <ChevronDown size={15} className="text-[var(--text-muted)]" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[var(--border-card)]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Why this score</p>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-[var(--accent-soft)]">
                            <span className="block text-[var(--text-muted)]">Importance</span>
                            <span className="font-bold text-[var(--text-main)]">{Math.round(contributions.importance)}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--accent-soft)]">
                            <span className="block text-[var(--text-muted)]">Urgency</span>
                            <span className="font-bold text-[var(--text-main)]">{Math.round(contributions.urgency)}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-rose-500/10">
                            <span className="block text-[var(--text-muted)]">Effort (−)</span>
                            <span className="font-bold text-rose-500">{Math.round(contributions.effort)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2">
                          Raw = {Math.round(contributions.importance + contributions.urgency - contributions.effort)}, normalized to 0–100 with the current weights.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {ranked.length > 0 && (
            <div className="pt-4 mt-4 border-t border-[var(--border-card)] flex justify-end">
              <Link to="/tasks" className="text-[11px] font-semibold text-accent flex items-center gap-1 hover:underline">
                Open Kanban board <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPrioritizerPage;
