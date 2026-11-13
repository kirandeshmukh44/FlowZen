import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart3, CheckCircle2, Clock, Calendar,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import EmptyState from '../components/ui/EmptyState';
import {
  scopeTasksForRole, selectTaskCounts, selectOnTimeRate,
  selectStatusBreakdown, selectThroughput, isCompleted,
} from '../lib/metrics';

const RANGES = ['7d', '30d', 'Quarter', 'Year'];
const RANGE_KEY = { '7d': '7d', '30d': '30d', Quarter: 'quarter', Year: 'year' };

export const AnalyticsPage = () => {
  const { tasks, teamMembers } = useTasks();
  const { user } = useAuth();
  const { playClick } = useSound();
  const [dateRange, setDateRange] = useState('30d');
  const rangeKey = RANGE_KEY[dateRange] || '30d';

  // Role-scoped through the same selectors as the dashboard.
  const scoped = useMemo(
    () => scopeTasksForRole(tasks, { user, teamMembers }),
    [tasks, user, teamMembers]
  );

  const counts = selectTaskCounts(scoped);
  const onTime = selectOnTimeRate(scoped);
  const breakdown = selectStatusBreakdown(scoped);
  const throughput = useMemo(() => selectThroughput(scoped, rangeKey), [scoped, rangeKey]);

  const hasCompletions = scoped.some(isCompleted);

  // Real activity feed derived from task timestamps — one entry per event
  // (dedupe: a completion timestamp wins over a same-time update).
  const activity = useMemo(() => {
    const events = [];
    for (const t of scoped) {
      const doneAt = t.completedAt ? new Date(t.completedAt) : null;
      const validDone = doneAt && !isNaN(doneAt.getTime()) ? doneAt : null;
      if (isCompleted(t) && validDone) {
        events.push({
          id: `${t.id}-done`, title: t.title,
          text: `completed "${t.title}"`, at: validDone, kind: 'done',
          actor: t.assignees?.[0]?.name || 'Team'
        });
      }
      const upd = t.updatedAt ? new Date(t.updatedAt) : null;
      if (upd && !isNaN(upd.getTime()) && (!validDone || upd.getTime() !== validDone.getTime())) {
        events.push({
          id: `${t.id}-upd`, title: t.title,
          text: `updated "${t.title}" → ${t.backendStatus}`, at: upd, kind: 'upd',
          actor: t.assignees?.[0]?.name || 'Team'
        });
      }
    }
    return events.sort((a, b) => b.at - a.at).slice(0, 8);
  }, [scoped]);

  const bucketNoun = rangeKey === 'quarter' ? 'week' : rangeKey === 'year' ? 'month' : 'day';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Throughput, on-time delivery, and status distribution — all from real task data.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl card-base bg-[var(--bg-card)]">
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => { playClick(); setDateRange(range); }}
              aria-pressed={dateRange === range}
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all ${
                dateRange === range
                  ? 'bg-accent text-white shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="card-base p-3.5 sm:p-5">
          <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider truncate block">Total Tasks</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">{counts.total}</div>
          <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] mt-1 inline-block truncate">
            {counts.cancelled > 0 ? `${counts.cancelled} cancelled (excluded)` : 'Cancelled tasks excluded'}
          </span>
        </div>
        <div className="card-base p-3.5 sm:p-5">
          <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider truncate block">Completed</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">{counts.completed}</div>
          <span className="text-[10px] sm:text-xs font-semibold text-accent mt-1 inline-block truncate">{counts.progressPercent}% completion rate</span>
        </div>
        <div className="card-base p-3.5 sm:p-5">
          <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider truncate block">On-Time Rate</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">
            {onTime === null ? '—' : `${onTime}%`}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] mt-1 inline-block truncate">
            {onTime === null ? 'No completed tasks yet' : 'Finished on/before deadline'}
          </span>
        </div>
        <div className="card-base p-3.5 sm:p-5">
          <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider truncate block">Open Tasks</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">{counts.open}</div>
          <span className="text-[10px] sm:text-xs font-semibold text-rose-500 mt-1 inline-block truncate">
            {counts.overdue} overdue
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Throughput: completions per bucket, current vs previous period */}
        <div className="md:col-span-2 card-base p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)]">Throughput</h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Completions per {bucketNoun} — current vs previous period
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-accent"><span className="w-3 h-0.5 bg-accent rounded" /> Current</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-0.5 bg-slate-400 rounded" /> Previous</span>
            </div>
          </div>

          {!hasCompletions ? (
            <EmptyState icon={BarChart3} title="No completions in this period" hint="Complete some tasks to see throughput here." />
          ) : (
            <div className="w-full h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughput} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--border-card)' }} minTickGap={rangeKey === '7d' ? 0 : 40} interval={rangeKey === '7d' ? 0 : 'preserveStartEnd'} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} width={28} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.10)', rx: 8 }}
                    contentStyle={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-card)', borderRadius: 12, fontSize: 12, color: 'var(--text-main)' }}
                  />
                  <Line type="monotone" dataKey="current" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3, fill: 'var(--accent)' }} />
                  <Line type="monotone" dataKey="previous" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut status breakdown */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Task Status Breakdown</h3>
            <p className="text-xs text-[var(--text-muted)]">Current lifecycle allocation</p>
          </div>

          {breakdown.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data yet" hint="Status distribution appears once tasks exist." />
          ) : (
            <>
              <div className="w-full h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                      {breakdown.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-card)', borderRadius: 12, fontSize: 12, color: 'var(--text-main)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-card)]">
                {breakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}: <strong className="text-[var(--text-main)]">{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent activity derived from real task timestamps */}
      <div className="card-base p-6">
        <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Recent Activity</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Derived from real task updates and completions.</p>
        {activity.length === 0 ? (
          <EmptyState icon={Clock} title="No activity yet" hint="Task completions and updates will appear here." />
        ) : (
          <div className="space-y-3">
            {activity.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-xs">
                <span className="p-1.5 rounded-xl bg-[var(--accent-soft)] text-accent shrink-0">
                  {e.kind === 'done' ? <CheckCircle2 size={14} /> : <Calendar size={14} />}
                </span>
                <span className="flex-1 text-[var(--text-main)] font-semibold truncate">{e.actor} {e.text}</span>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {e.at.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
