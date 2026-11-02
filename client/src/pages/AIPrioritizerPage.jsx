import React from 'react';
import { Sliders, Sparkles, Check, ArrowRight, Info, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSound } from '../hooks/useSound';
import toast from 'react-hot-toast';

export const AIPrioritizerPage = () => {
  const { tasks, weights, updateWeight } = useTasks();
  const { playClick, playSuccess } = useSound();

  const handleReset = () => {
    playClick();
    updateWeight('importance', 70);
    updateWeight('urgency', 80);
    updateWeight('effort', 35);
    toast.success('AI Priority weights reset to 70/80/35 default');
  };

  const handleApplyAll = () => {
    playSuccess();
    toast.success('Prioritization order applied to workspace sprints!');
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
            Tune algorithmic weights across your workspace. Recalculates all task queues in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-[var(--border-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--text-main)] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleApplyAll}
            className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Check size={14} /> Apply to Sprints
          </button>
        </div>
      </div>

      {/* Formula Card Banner */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-card)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>Mathematical Model Specification</span>
            </div>
            <div className="font-mono text-sm sm:text-base font-extrabold text-[var(--text-main)]">
              Priority Score = normalize( (W<sub>i</sub> × Importance) + (W<sub>u</sub> × Urgency) - (W<sub>e</sub> × Effort) )
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Weights (0-100) scale client-side. Urgency is continuously calculated from due-date proximity.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl card-base bg-[var(--bg-card)] text-center shrink-0">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider block">
              Active Tasks Scored
            </span>
            <span className="text-2xl font-black text-accent">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Sliders Panel & Live Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Controller (1 Col) */}
        <div className="card-base p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
              Global Weight Sliders
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Slide to adjust emphasis across teams.
            </p>
          </div>

          <div className="space-y-6">
            {/* Importance */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[var(--text-main)]">Importance Weight (W<sub>i</sub>)</span>
                <span className="text-accent font-bold">{weights.importance} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.importance}
                onChange={(e) => updateWeight('importance', e.target.value)}
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Impact on company OKRs and architecture.</span>
            </div>

            {/* Urgency */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[var(--text-main)]">Urgency Weight (W<sub>u</sub>)</span>
                <span className="text-accent font-bold">{weights.urgency} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.urgency}
                onChange={(e) => updateWeight('urgency', e.target.value)}
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Penalty scaling for impending due dates.</span>
            </div>

            {/* Effort */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[var(--text-main)]">Effort Discount (W<sub>e</sub>)</span>
                <span className="text-accent font-bold">{weights.effort} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.effort}
                onChange={(e) => updateWeight('effort', e.target.value)}
                className="w-full h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Preference for quick-win low-effort deliverables.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] text-xs text-[var(--text-muted)] flex items-start gap-2">
            <Info size={16} className="text-accent shrink-0 mt-0.5" />
            <span>High priority tier triggers when AI Score ≥ 80%. Medium tier covers 50-79%.</span>
          </div>
        </div>

        {/* Live Ranked Results Queue (2 Cols) */}
        <div className="lg:col-span-2 card-base p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                Ranked Sprints Queue
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Sorted descending by real-time normalized score.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-soft)] text-accent">
              Live Re-ordering Active
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-[var(--border-card)] shadow-2xs hover:shadow-sm hover:border-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                      <span>Due {task.deadline}</span>
                      <span>•</span>
                      <span>Importance: {task.importance}/10</span>
                      <span>•</span>
                      <span>Effort: {task.effort}h</span>
                      <span>•</span>
                      <span>Assignee: {task.assignee?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center self-end">
                  <div className="text-right">
                    <span className="text-base font-black text-accent">
                      {task.aiScore}%
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      AI Score
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIPrioritizerPage;
