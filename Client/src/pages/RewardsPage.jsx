import React, { useState, useEffect } from 'react';
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
import Avatar from '../components/ui/Avatar';
import apiClient from '../api/client';

export const RewardsPage = () => {
  const { gamification, teamMembers } = useTasks();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiClient.get('/rewards/leaderboard');
        if (res.data?.success && Array.isArray(res.data.leaderboard)) {
          setLeaderboard(res.data.leaderboard);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard:', err?.message);
      }
    };
    fetchLeaderboard();
  }, []);

  const streakCount = gamification.taskStreak || 0;
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const isCompleted = i < (streakCount % 7 || (streakCount > 0 ? 7 : 0));
    return {
      day: dayNames[i],
      completed: isCompleted,
      active: i === 6
    };
  });

  const catalogBadges = [
    {
      id: 'first-victory',
      name: 'First Victory',
      icon: '🏅',
      description: 'Complete your first task deliverable',
      unlocked: (gamification.completedCount || 0) >= 1,
    },
    {
      id: 'zen-streak',
      name: 'Zen Streak',
      icon: '🔥',
      description: 'Achieve 7 consecutive days of delivery',
      unlocked: (gamification.taskStreak || 0) >= 7,
    },
    {
      id: 'task-master',
      name: 'Task Master',
      icon: '👑',
      description: 'Successfully complete 10+ assigned tasks',
      unlocked: (gamification.completedCount || 0) >= 10,
    },
    {
      id: 'rising-star',
      name: 'Rising Star',
      icon: '⭐',
      description: 'Accumulate over 1000 total focus XP',
      unlocked: (gamification.xp || 0) >= 1000,
    },
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
      <div className="card-base p-4 sm:p-8 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-card)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md font-bold shrink-0">
              <Trophy size={28} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
                  {gamification.levelName || `Level ${gamification.userLevel}`}
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Flame size={14} className="fill-amber-500" /> {gamification.taskStreak} Day Focus Streak
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)]">
                Focus Velocity Champion
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5">
                Latest: <strong className="text-accent">{gamification.latestBadge}</strong>
              </p>
            </div>
          </div>

          {/* XP Progress Container */}
          <div className="w-full md:w-72 p-3 sm:p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-card)]">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--text-muted)]">Tier Progress{gamification.nextLevelName ? ` → ${gamification.nextLevelName}` : ''}</span>
              <span className="text-accent">{gamification.progressToNext != null ? `${gamification.progressToNext}%` : `${gamification.xp} XP`}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, gamification.progressToNext ?? Math.min(100, (gamification.xp / (gamification.nextLevelXp || 1)) * 100))}%` }}
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
      <div className="card-base p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span>15-Day Unbroken Streak</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
              Completing at least 1 task daily preserves your momentum fire.
            </p>
          </div>
          <span className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-accent shrink-0">
            Active 🔥
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1.5 sm:gap-2 pt-1">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
        
        {/* Badges Grid (2 Cols) */}
        <div className="md:col-span-2 card-base p-4 sm:p-6">
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
            Achievement Badges
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Earned through on-time deliveries and focus sessions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalogBadges.map((badge) => (
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
                      Unlocked
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
            {(leaderboard.length ? leaderboard : [...teamMembers].sort((a, b) => (b.xp || 0) - (a.xp || 0))).map((m, idx) => (
              <div
                key={m.id || idx}
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
                  <Avatar name={m.name} src={m.avatar} size={28} />
                  <div>
                    <span className="font-bold text-[var(--text-main)] block">{m.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{m.role}</span>
                  </div>
                </div>

                <span className="font-extrabold text-accent">
                  {m.xp || 0} XP
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

