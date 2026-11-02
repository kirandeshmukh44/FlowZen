import React from 'react';
import { Trophy, Flame, Sparkles, Award, Star, Zap, CheckCircle2, Lock } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export const GamificationPage = () => {
  const { gamification } = useTasks();

  const streakDays = [
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: true },
    { day: 'Fri', completed: true },
    { day: 'Sat', completed: true },
    { day: 'Sun', completed: true },
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: true },
    { day: 'Fri', completed: true },
    { day: 'Sat', completed: true },
    { day: 'Sun', completed: true },
    { day: 'Today', completed: true, active: true },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-accent dark:text-accent uppercase tracking-wider">
          Recognition & Streaks
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zen-textDark dark:text-zen-textLight tracking-tight mt-0.5">
          Zen Mastery & Gamification
        </h1>
        <p className="text-xs text-zen-muted mt-1">
          Celebrate continuous momentum, level up through high-impact deliveries, and collect team awards.
        </p>
      </div>

      {/* Main Level & Streak Banner (Matching Reference Gamification Card) */}
      <div className="glass-card p-6 sm:p-8 bg-gradient-to-r from-accent/50 via-white/50 to-butter-yellow/30 dark:from-[#2a1e22] dark:via-[#1c1819] dark:to-[#1a1516] border border-accent/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent to-accent-hover p-4 text-white shadow-xl flex items-center justify-center shrink-0">
              <Trophy size={42} className="fill-white/20" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent text-white shadow-xs">
                  {gamification.userLevel} Level
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Flame size={14} className="fill-amber-500" /> {gamification.taskStreak} Days Streak!
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zen-textDark dark:text-zen-textLight">
                Focus Mastery Champion
              </h2>
              <p className="text-xs text-zen-muted mt-1">
                Latest Award Earned: <strong className="text-accent dark:text-accent">{gamification.latestBadge}</strong>
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full md:w-64 p-4 rounded-2xl bg-white/70 dark:bg-black/30 border border-accent/20">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-zen-textDark dark:text-zen-textLight">Progress to Elite</span>
              <span className="text-accent">{gamification.xp} / {gamification.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-3 rounded-full bg-accent/15 overflow-hidden">
              <div
                style={{ width: `${(gamification.xp / gamification.nextLevelXp) * 100}%` }}
                className="h-full rounded-full bg-gradient-to-r from-butter-yellow to-accent transition-all duration-700"
              />
            </div>
            <span className="text-[10px] text-zen-muted mt-1.5 block text-center font-medium">
              650 XP needed for next milestone
            </span>
          </div>
        </div>
      </div>

      {/* 15-Day Consecutive Streak Calendar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zen-textDark dark:text-zen-textLight flex items-center gap-2">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              15-Day Zen Momentum Calendar
            </h3>
            <p className="text-xs text-zen-muted">
              Every day with at least 1 completed task preserves your flame.
            </p>
          </div>
          <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
            Unbroken Streak 🔥
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-15 gap-2 pt-2">
          {streakDays.map((s, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl text-center border transition-all ${
                s.active
                  ? 'bg-accent text-white border-accent shadow-rose-glow scale-105'
                  : 'bg-accent/10 border-accent/25 text-accent dark:text-accent'
              }`}
            >
              <div className="text-[10px] font-bold opacity-75">{s.day}</div>
              <div className="text-sm font-extrabold mt-1">✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Showcase Grid */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-zen-textDark dark:text-zen-textLight mb-1">
          Achievements & Milestones
        </h3>
        <p className="text-xs text-zen-muted mb-5">
          Special awards awarded through high velocity and mindful delivery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gamification.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'glass-card bg-gradient-to-br from-white/80 to-accent/30 dark:from-white/10 dark:to-accent/10 border-accent/40 shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 border-dashed border-zinc-400/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{badge.icon}</span>
                {badge.unlocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Unlocked {badge.unlockedDate}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/20 text-zinc-500 flex items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-zen-textDark dark:text-zen-textLight">
                {badge.name}
              </h4>
              <p className="text-xs text-zen-muted mt-1 leading-snug">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
