import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import {
  Clock, CheckCircle2, Zap, Target, Trophy,
  ArrowRight, Sparkles, BarChart3, Trash2,
} from 'lucide-react';
import apiClient, { USE_MOCK } from '../../api/client';
import AddTaskModal from '../../components/ui/AddTaskModal';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { KpiCard, SectionCard, TaskRow } from './shared';
import { useDashboardData } from './useDashboard';
import { useTasks } from '../../context/TaskContext';
import { useSound } from '../../hooks/useSound';

const AdminDashboard = () => {
  const d = useDashboardData();
  const { counts, completedPerDay, statusBreakdown, overdue, awaitingApproval, recentActivity, workload, user } = d;
  const { moveTaskColumn, deleteTask, approveTask, sendBackTask } = useTasks();
  const [approvingId, setApprovingId] = useState(null);

  const handleDelete = (t) => {
    if (window.confirm(`Delete "${t.title}"? This cannot be undone.`)) deleteTask(t.id);
  };
  const handleApprove = async (t) => { setApprovingId(t.id); await approveTask(t.id); setApprovingId(null); };
  const handleSendBack = async (t) => { setApprovingId(t.id); await sendBackTask(t.id); setApprovingId(null); };
  const { playClick } = useSound();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (USE_MOCK) return;
    apiClient.get('/rewards/leaderboard')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.leaderboard)) setLeaderboard(res.data.leaderboard);
      })
      .catch(() => {});
  }, []);

  const hasAnyTasks = counts.total > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Workspace overview{d.user?.company ? ` — ${d.user.company}` : ''}. All numbers reflect real task data.
          </p>
        </div>
        <button
          onClick={() => { playClick(); setIsAddOpen(true); }}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all self-start sm:self-auto"
        >
          Create Task
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <KpiCard icon={Clock} label="Open Tasks" value={counts.open} accent sub="Not completed or cancelled" />
        <KpiCard icon={CheckCircle2} label="Completed" value={counts.completed} sub={`${counts.progressPercent}% of all tasks`} />
        <KpiCard icon={Zap} label="In Progress" value={counts.inProgress} sub="Actively being worked" />
        <KpiCard icon={Target} label="In Review" value={counts.inReview} sub="Awaiting review" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SectionCard
          title="Completed per day"
          className="md:col-span-2"
          action={<span className="text-[11px] text-[var(--text-muted)]">Last 7 days</span>}
        >
          {!hasAnyTasks ? (
            <EmptyState icon={BarChart3} title="No tasks yet" hint="Completed tasks will chart here once your team starts delivering." ctaLabel="Create your first task" onCta={() => setIsAddOpen(true)} />
          ) : (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completedPerDay} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} width={28} tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-subtle)', borderRadius: 12, fontSize: 12, color: 'var(--text-main)' }} />
                  <Bar dataKey="tasks" radius={[8, 8, 0, 0]} fill="var(--accent)" maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Task Status" action={<Link to="/analytics" className="text-[11px] font-semibold text-accent flex items-center gap-1">Analytics <ArrowRight size={12} /></Link>}>
          {statusBreakdown.length === 0 ? (
            <EmptyState icon={Target} title="No data yet" hint="Status breakdown appears once tasks exist." />
          ) : (
            <>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                      {statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-subtle)', borderRadius: 12, fontSize: 12, color: 'var(--text-main)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-card)]">
                {statusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}: <strong className="text-[var(--text-main)]">{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Lists row: workload / overdue / approval / activity / leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <SectionCard title="Team Workload" action={<span className="text-[11px] text-[var(--text-muted)]">open tasks / 5</span>}>
          {workload.length === 0 ? (
            <EmptyState icon={Trophy} title="No team members" hint="Members appear here once users are added to the workspace." />
          ) : (
            <div className="space-y-2.5">
              {workload.slice(0, 6).map(({ member, open, percent }) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  <Avatar name={member.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-[var(--text-main)] truncate">{member.name}</span>
                      <span className={percent >= 100 ? 'text-rose-500' : 'text-[var(--text-muted)]'}>{open} open</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${percent >= 100 ? 'bg-rose-500' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Overdue" action={<span className="text-[11px] font-bold text-rose-500">{overdue.length}</span>}>
          {overdue.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing overdue" hint="All open tasks are within their deadlines." />
          ) : (
            <div className="space-y-2">
              {overdue.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} onClick={() => playClick()} onDelete={handleDelete} />)}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Awaiting Approval" action={<span className="text-[11px] font-bold text-accent">{awaitingApproval.length}</span>}>
          {awaitingApproval.length === 0 ? (
            <EmptyState icon={Sparkles} title="Nothing to approve" hint="Completed work awaiting review shows up here." />
          ) : (
            <div className="space-y-2">
              {awaitingApproval.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-card)]">
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[var(--text-main)] truncate">{t.title}</span>
                    <span className="block text-[10px] text-[var(--text-muted)]">{t.backendStatus}</span>
                  </div>
                  <button
                    onClick={() => handleApprove(t)}
                    disabled={approvingId === t.id}
                    className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {approvingId === t.id ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleSendBack(t)}
                    disabled={approvingId === t.id}
                    className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Send back
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    title="Delete task"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <SectionCard title="Recent Activity" className="lg:col-span-2">
          {recentActivity.length === 0 ? (
            <EmptyState icon={Sparkles} title="No activity yet" hint="Task completions and updates will appear here." />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <span className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${a.action === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-[var(--accent-soft)] text-accent'}`}>
                    {a.action === 'completed' ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--text-main)] font-semibold block truncate">
                      {a.action === 'completed' ? `Completed "${a.title}"` : `"${a.title}" → ${a.status || 'updated'}`}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="XP Leaderboard" action={<Link to="/rewards" className="text-[11px] font-semibold text-accent flex items-center gap-1">Rewards <ArrowRight size={12} /></Link>}>
          {leaderboard.length === 0 ? (
            <EmptyState icon={Trophy} title="No XP yet" hint="Approve completions to start earning XP." />
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 6).map((m, i) => (
                <div key={m.id || m._id || i} className="flex items-center gap-2.5 p-2 rounded-xl border border-[var(--border-card)]">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{i + 1}</span>
                  <Avatar name={m.name} size={26} />
                  <span className="flex-1 text-xs font-semibold text-[var(--text-main)] truncate">{m.name}</span>
                  <span className="text-xs font-extrabold text-accent">{m.xp || 0} XP</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <AddTaskModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </motion.div>
  );
};

export default AdminDashboard;
