import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, 
  BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Activity, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { kpiMetrics, initialTeamMembers } from '../mock/mockData';
import { useTasks } from '../context/TaskContext';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';

export const AnalyticsPage = () => {
  const { tasks } = useTasks();
  const { accentPreset } = useAppearance();
  const { playClick } = useSound();
  const [dateRange, setDateRange] = useState('30d');

  // Throughput comparative data
  const throughputData = [
    { period: 'Week 1', current: 24, previous: 18 },
    { period: 'Week 2', current: 36, previous: 28 },
    { period: 'Week 3', current: 42, previous: 35 },
    { period: 'Week 4', current: 58, previous: 44 },
    { period: 'Week 5', current: 65, previous: 52 },
  ];

  // Donut status distribution
  const statusData = [
    { name: 'Completed', value: tasks.filter(t => t.completed).length, color: 'var(--accent)' },
    { name: 'Running', value: tasks.filter(t => t.column === 'in_progress').length, color: '#F59E0B' },
    { name: 'Review', value: tasks.filter(t => t.column === 'review').length, color: '#8B5CF6' },
    { name: 'Backlog', value: tasks.filter(t => t.column === 'backlog').length, color: '#94A3B8' },
  ];

  // Activity Feed
  const activities = [
    { id: 'act-1', text: 'Kiran Deshmukh completed "API Integration & Auth Guards"', time: '20 minutes ago', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 'act-2', text: 'AI Prioritizer recalculated sprint queue weights', time: '1 hour ago', icon: Sparkles, color: 'text-accent' },
    { id: 'act-3', text: 'Gayatri Joshi moved "Schema Review" to In Progress', time: '3 hours ago', icon: Zap, color: 'text-amber-500' },
    { id: 'act-4', text: 'Team milestone: 15-day continuous focus streak achieved', time: 'Yesterday', icon: Activity, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Throughput velocity, completion benchmarks, and audit feed.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl card-base bg-[var(--bg-card)]">
          {['7d', '30d', 'Quarter', 'Year'].map((range) => (
            <button
              key={range}
              onClick={() => {
                playClick();
                setDateRange(range);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Total Throughput
          </span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">
            225
          </div>
          <span className="text-xs font-semibold text-emerald-500 mt-1 inline-block">
            ↑ 28% vs previous cycle
          </span>
        </div>

        <div className="card-base p-5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Avg. Cycle Velocity
          </span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">
            {kpiMetrics.avgVelocity}
          </div>
          <span className="text-xs font-semibold text-accent mt-1 inline-block">
            18 tasks / active sprint
          </span>
        </div>

        <div className="card-base p-5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            On-Time Benchmark
          </span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">
            94.2%
          </div>
          <span className="text-xs font-semibold text-emerald-500 mt-1 inline-block">
            Target exceeded (&gt;90%)
          </span>
        </div>

        <div className="card-base p-5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            AI Alignment Score
          </span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight mt-1">
            {kpiMetrics.aiAlignmentScore}%
          </div>
          <span className="text-xs font-semibold text-[var(--text-muted)] mt-1 inline-block">
            Optimal workload parity
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Throughput Line Chart: Current vs Previous (2 cols) */}
        <div className="lg:col-span-2 card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Throughput Velocity (Current vs Previous)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Cumulative closed deliverables over sprint intervals
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-accent">
                <span className="w-3 h-0.5 bg-accent rounded" /> This period
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-400 rounded" /> Previous
              </span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-card)',
                    borderRadius: '12px',
                    fontSize: '12px' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="var(--accent)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--accent)' }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#94A3B8" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Breakdown (1 col) */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Task Status Breakdown
            </h3>
            <p className="text-xs text-[var(--text-muted)]">Current lifecycle allocation</p>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-card)',
                    borderRadius: '12px',
                    fontSize: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-card)]">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Activity Feed Section */}
      <div className="card-base p-6">
        <h3 className="text-base font-bold text-[var(--text-main)] mb-4">
          Audit & Activity Feed
        </h3>

        <div className="space-y-4">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <span className={`p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${act.color} shrink-0 mt-0.5`}>
                  <Icon size={14} />
                </span>
                <div className="flex-1">
                  <span className="text-[var(--text-main)] font-semibold block">{act.text}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
