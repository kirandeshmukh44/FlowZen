import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Send, CheckCircle2, AlertTriangle, CalendarClock,
  MessageSquare, Flame, Trophy, ArrowRight,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { FocusTimer, SectionCard, TaskRow } from './shared';
import { useDashboardData } from './useDashboard';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../hooks/useSound';

const EmployeeDashboard = () => {
  const d = useDashboardData();
  const { user } = useAuth();
  const { moveTaskColumn, refreshRewards, gamification } = useTasks();
  const { playClick, playSuccess } = useSound();
  const navigate = useNavigate();
  const { myGroups, counts } = d;

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'there';

  const quickAction = (task, column) => {
    playClick();
    moveTaskColumn(task.id, column);
  };

  const TaskGroup = ({ title, tasks, empty }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</h4>
        <span className="text-[10px] font-bold text-[var(--text-muted)]">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[11px] text-[var(--text-muted)] py-2">{empty}</p>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 6).map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-card)]">
              <div className="flex-1 min-w-0">
                <span className={`block text-xs font-semibold truncate ${t.completed ? 'line-through text-slate-400' : 'text-[var(--text-main)]'}`}>{t.title}</span>
                <span className="block text-[10px] text-[var(--text-muted)]">{t.backendStatus}{t.deadline ? ` · Due ${t.deadline}` : ''}{t.reviewNote ? ` · Note: "${t.reviewNote}"` : ''}</span>
              </div>
              {!t.completed && t.backendStatus !== 'Completed' && (
                <div className="flex items-center gap-1 shrink-0">
                  {t.backendStatus === 'Pending' && (
                    <button onClick={() => quickAction(t, 'in_progress')} className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-[var(--accent-soft)] text-accent text-[10px] font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1">
                      <Play size={11} /> Start
                    </button>
                  )}
                  {t.backendStatus !== 'Review' && (
                    <button onClick={() => quickAction(t, 'review')} className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-500 hover:text-white transition-colors flex items-center gap-1">
                      <Send size={11} /> Review
                    </button>
                  )}
                </div>
              )}
              {t.backendStatus === 'Review' && (
                <span className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[10px] font-bold shrink-0">Pending approval</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">My Dashboard</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Hey {firstName} — here's your day at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* XP / streak card */}
        <div className="card-base p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size={44} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Your Level</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[var(--text-main)]">Level {gamification.userLevel || 1}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                  <Flame size={13} className="fill-amber-500" /> {gamification.taskStreak || 0}d
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-[var(--text-muted)]">{gamification.xp || 0} XP</span>
              <span className="text-[var(--text-muted)]">{gamification.completedCount || 0} tasks done</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, ((gamification.xp || 0) % 500) / 5)}%` }} />
            </div>
          </div>
        </div>

        {/* Focus timer — always visible, dark card readable in both themes */}
        <div className="md:col-span-2">
          <FocusTimer onComplete={refreshRewards} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <SectionCard title="My Tasks" className="lg:col-span-2" action={<Link to="/tasks" className="text-[11px] font-semibold text-accent flex items-center gap-1">Board <ArrowRight size={12} /></Link>}>
          {counts.total === 0 ? (
            <EmptyState icon={CheckCircle2} title="No tasks assigned" hint="When your manager assigns work, it will show up here." />
          ) : (
            <div className="space-y-5">
              <TaskGroup title="Overdue" tasks={myGroups.overdue} empty="Nothing overdue." />
              <TaskGroup title="Due this week" tasks={[...myGroups.today, ...myGroups.week]} empty="Nothing due this week." />
              <TaskGroup title="Later" tasks={myGroups.later} empty="Nothing scheduled." />
              {myGroups.done.length > 0 && (
                <TaskGroup title="Completed" tasks={myGroups.done} empty="" />
              )}
            </div>
          )}
        </SectionCard>

        <div className="space-y-4 sm:space-y-6">
          <Link
            to={user?.createdBy ? `/chat?dm=${user.createdBy}` : '/chat'}
            className="card-base p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-accent"><MessageSquare size={16} /></span>
            <div className="flex-1">
              <span className="text-xs font-bold text-[var(--text-main)] block">Ask my manager</span>
              <span className="text-[10px] text-[var(--text-muted)]">Send a direct message</span>
            </div>
            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </Link>

          <SectionCard title="Deadlines" action={<CalendarClock size={14} className="text-accent" />}>
            {myGroups.overdue.length + myGroups.week.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All clear" hint="No upcoming deadlines." />
            ) : (
              <div className="space-y-2">
                {[...myGroups.overdue, ...myGroups.week].slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </SectionCard>

          <Link
            to="/rewards"
            className="card-base p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500"><Trophy size={16} /></span>
            <div className="flex-1">
              <span className="text-xs font-bold text-[var(--text-main)] block">Badges & XP</span>
              <span className="text-[10px] text-[var(--text-muted)]">{gamification.badges?.length || 0} badges earned</span>
            </div>
            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeDashboard;
