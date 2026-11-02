import React from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  Star, 
  Zap, 
  CheckCircle2, 
  Lock,
  Gift,
  ArrowRight
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSound } from '../hooks/useSound';
import toast from 'react-hot-toast';

export const RewardsPage = () => {
  const { gamification, teamMembers } = useTasks();
  const { playClick, playSuccess, playLevelUp } = useSound();

  const handleClaimReward = (name) => {
    playLevelUp();
    toast.success(`Claimed reward: ${name}!`);
  };

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
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
          Rewards & Gamification
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Celebrate delivery streaks, unlock achievement badges, and climb the team velocity leaderboard.
        </p>
      </div>

      {/* Main Banner: Level & XP Bar */}
      <div className="card-base p-6 sm:p-8 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-card)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md font-bold shrink-0">
              <Trophy size={32} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
                  {gamification.userLevel}
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Flame size={14} className="fill-amber-500" /> {gamification.taskStreak} Day Focus Streak
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                Focus Velocity Champion
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Latest Achievement: <strong className="text-accent">{gamification.latestBadge}</strong>
              </p>
            </div>
          </div>

          {/* XP Progress Container */}
          <div className="w-full md:w-72 p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-card)]">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--text-muted)]">Progress to Next Tier</span>
              <span className="text-accent">{gamification.xp} / {gamification.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${(gamification.xp / gamification.nextLevelXp) * 100}%` }}
                className="h-full rounded-full bg-accent transition-all duration-700"
              />
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block text-center mt-1.5 font-medium">
              650 XP until Elite Status
            </span>
          </div>
        </div>
      </div>

      {/* 15-Day Consecutive Streak Calendar */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span>15-Day Unbroken Streak</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Completing at least 1 task daily preserves your momentum fire.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent-soft)] text-accent">
            Active 🔥
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-15 gap-2 pt-1">
          {streakDays.map((s, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl text-center border transition-all ${
                s.active
                  ? 'bg-accent text-white border-accent shadow-xs scale-105'
                  : 'bg-[var(--bg-page)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              <div className="text-[10px] font-bold">{s.day}</div>
              <div className="text-xs font-extrabold mt-1">✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Badges (2 Cols) + Leaderboard (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Badges Grid (2 Cols) */}
        <div className="lg:col-span-2 card-base p-6">
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
            Achievement Badges
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Earned through on-time deliveries and focus sessions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gamification.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all ${
                  badge.unlocked
                    ? 'border-accent bg-[var(--accent-soft)]'
                    : 'border-[var(--border-card)] bg-[var(--bg-page)] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{badge.icon}</span>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Unlocked {badge.unlockedDate}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">{badge.name}</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leaderboard (1 Col) */}
        <div className="card-base p-6">
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
            Velocity Leaderboard
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Ranked by total XP earned</p>

          <div className="space-y-3">
            {[...teamMembers].sort((a, b) => (b.xp || 0) - (a.xp || 0)).map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-card)] bg-white dark:bg-slate-900/50 shadow-2xs text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-amber-400 text-amber-950' :
                    idx === 1 ? 'bg-slate-300 text-slate-800' :
                    idx === 2 ? 'bg-amber-700 text-amber-100' :
                    'text-[var(--text-muted)]'
                  }`}>
                    {idx + 1}
                  </span>
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-main)] block">{m.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{m.role}</span>
                  </div>
                </div>

                <span className="font-extrabold text-accent">
                  {m.xp || 1200} XP
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default RewardsPage;

