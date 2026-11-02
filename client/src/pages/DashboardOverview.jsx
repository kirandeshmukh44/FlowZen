import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Flame, 
  Calendar, 
  Check, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  MoreVertical,
  Zap,
  Target
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import AddTaskModal from '../components/ui/AddTaskModal';

// Animated Count-Up Number Component
const CountUp = ({ to, duration = 1.2 }) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(to, 10) || 0;
    if (start === end) {
      setVal(end);
      return;
    }
    const totalSteps = 40;
    const stepTime = (duration * 1000) / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = Math.min(end, Math.round((step / totalSteps) * end));
      setVal(current);
      if (step >= totalSteps) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [to, duration]);

  return <span>{val}</span>;
};

export const DashboardOverview = () => {
  const { tasks, weights, updateWeight, markComplete, teamMembers } = useTasks();
  const { user } = useAuth();
  const { accentPreset } = useAppearance();
  const { playClick, playSuccess, playTimer, playToggle } = useSound();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState(3);

  // Focus Timer state (25:00 = 1500 seconds)
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playSuccess();
      alert('Focus session accomplished! +50 XP granted.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, playSuccess]);

  const toggleTimer = () => {
    playTimer(!isTimerRunning);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    playClick();
    setIsTimerRunning(false);
    setTimerSeconds(1500);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  // Metrics counts
  const openTasksCount = tasks.filter(t => !t.completed).length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const inProgressCount = tasks.filter(t => t.column === 'in_progress').length;
  const pendingReviewCount = tasks.filter(t => t.column === 'review').length;

  const totalTasks = tasks.length || 1;
  const progressPercent = Math.round((completedTasksCount / totalTasks) * 100);

  // Bar chart data for Project Analytics
  const analyticsData = [
    { day: 'Mon', tasks: 12 },
    { day: 'Tue', tasks: 19 },
    { day: 'Wed', tasks: 15 },
    { day: 'Thu', tasks: 26 }, // Highlighted bar
    { day: 'Fri', tasks: 22 },
    { day: 'Sat', tasks: 14 },
    { day: 'Sun', tasks: 18 },
  ];

  // Reminders list
  const reminders = [
    { id: 'rem-1', title: 'Submit Sprint Q4 review', due: 'Today at 5:00 PM', priority: 'High' },
    { id: 'rem-2', title: 'Calibrate AI Prioritizer weights', due: 'Tomorrow at 10:00 AM', priority: 'Medium' },
    { id: 'rem-3', title: 'Sync with frontend engineering', due: 'Nov 03 at 2:30 PM', priority: 'Low' },
  ];

  // Animation container variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-6"
    >
      
      {/* ===================== DASHBOARD TITLE HEADER ===================== */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Welcome back, {user?.name}. Here's what's happening across your workspace today.
          </p>
        </div>
      </motion.div>

      {/* ===================== 4 KPI CARDS (First card filled with accent) ===================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Filled with solid accent color */}
        <div className="card-base card-hover p-5 bg-accent text-white relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Open Tasks</span>
            <span className="p-1.5 rounded-lg bg-white/20">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <CountUp to={openTasksCount} />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] opacity-90">
            <span>Requires active delivery</span>
          </div>
        </div>

        {/* Card 2: Completed Tasks */}
        <div className="card-base card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Completed</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            <CountUp to={completedTasksCount} />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>↑ 14% vs last week</span>
          </div>
        </div>

        {/* Card 3: Running (In Progress) */}
        <div className="card-base card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Running</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Zap size={16} />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            <CountUp to={inProgressCount} />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-[var(--text-muted)]">
            <span>In active sprint cycle</span>
          </div>
        </div>

        {/* Card 4: Pending Review */}
        <div className="card-base card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pending Review</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Target size={16} />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            <CountUp to={pendingReviewCount} />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-[var(--text-muted)]">
            <span>Awaiting validation</span>
          </div>
        </div>

      </motion.div>

      {/* ===================== MIDDLE ROW: PROJECT ANALYTICS + RADIAL PROGRESS + FOCUS TIMER ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Analytics Bar Chart (2 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">Project Analytics</h2>
              <p className="text-xs text-[var(--text-muted)]">Completed deliverables per day this sprint</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" />
              <span>Peak output</span>
            </div>
          </div>

          <div className="w-full h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-rose)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--brand-violet)" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-subtle)' }} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-subtle)' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-card)', 
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    color: 'var(--text-main)'
                  }} 
                />
                <Bar 
                  dataKey="tasks" 
                  radius={[10, 10, 0, 0]} 
                  barSize={32}
                  animationDuration={1200}
                  onClick={(entry, index) => {
                    playClick();
                    setSelectedBarIndex(index);
                  }}
                >
                  {analyticsData.map((entry, index) => (
                    <Cell 
                      key={`bar-${index}`} 
                      fill="url(#barGradient)" 
                      opacity={index === selectedBarIndex ? 1 : 0.75}
                      className="cursor-pointer transition-all duration-200 hover:opacity-100"
                      style={{ filter: index === selectedBarIndex ? 'drop-shadow(0 0 8px var(--accent))' : 'none' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Average velocity: 18 tasks / day</span>
            <span className="text-accent font-semibold flex items-center gap-1">
              <TrendingUp size={14} /> +24% efficiency
            </span>
          </div>
        </motion.div>

        {/* Right Column: Radial Project Progress + Sleek Dark Focus Timer (1 col) */}
        <motion.div variants={itemVariants} className="space-y-6 flex flex-col">
          
          {/* Radial Project Progress */}
          <div className="card-base p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Project Progress
              </span>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Sprint Health</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {completedTasksCount} of {totalTasks} tasks closed
              </p>
            </div>

            {/* Radial SVG Circle Progress */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  initial={{ strokeDashoffset: 238.76 }}
                  animate={{ strokeDashoffset: 238.76 - (238.76 * progressPercent) / 100 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-extrabold text-[var(--text-main)]">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Dark Focus Timer Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-rose-900/40 via-violet-900/30 to-teal-900/30 text-white shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden border border-[var(--border-subtle)] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-accent" />
                <span>Deep Work Focus</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-accent text-[10px] font-bold">
                +50 XP
              </span>
            </div>

            {/* Large Timer Display */}
            <div className="my-4 text-center">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider">
                {formatTime(timerSeconds)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {isTimerRunning ? 'Zen focus state active...' : 'Ready to start 25m sprint'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className="px-5 py-2 rounded-xl bg-accent hover:opacity-90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset timer"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

        </motion.div>

      </div>

      {/* ===================== BOTTOM ROW: REMINDERS + TEAM COLLABORATION + AI PRIORITIZER ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reminders List (1 col) */}
        <motion.div variants={itemVariants} className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--text-main)]">Reminders</h3>
            <span className="text-xs font-semibold text-accent">{reminders.length} pending</span>
          </div>

          <div className="space-y-3">
            {reminders.map((rem) => (
              <div 
                key={rem.id}
                onClick={() => playClick()}
                className="p-3 rounded-xl border border-[var(--border-card)] hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[var(--text-main)] group-hover:text-accent transition-colors">
                    {rem.title}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    rem.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                    rem.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {rem.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--text-muted)]">
                  <Calendar size={12} />
                  <span>{rem.due}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team Collaboration with Status Chips (1 col) */}
        <motion.div variants={itemVariants} className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--text-main)]">Team Collaboration</h3>
            <span className="text-xs font-semibold text-[var(--text-muted)]">{teamMembers.length} active</span>
          </div>

          <div className="space-y-3">
            {teamMembers.slice(0, 4).map((member, i) => {
              const statusTypes = ['In Focus', 'Online', 'In Meeting', 'Online'];
              const status = statusTypes[i % statusTypes.length];
              return (
                <div 
                  key={member.id} 
                  onClick={() => playClick()}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-card)] ${
                        status === 'In Focus' ? 'bg-purple-500' :
                        status === 'In Meeting' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-main)] block">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    status === 'In Focus' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                    status === 'In Meeting' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Priority Scorer Live Preview (1 col) */}
        <motion.div variants={itemVariants} className="card-base p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">AI Priority Scorer</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Weights re-order results in real time</p>
              </div>
              <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-accent">
                <Sliders size={16} />
              </div>
            </div>

            {/* 3 Weight Sliders */}
            <div className="space-y-2.5 py-2 border-b border-[var(--border-card)] mb-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-medium">Importance (W<sub>i</sub>)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.importance}
                  onChange={(e) => updateWeight('importance', e.target.value)}
                  className="w-28 h-1.5 cursor-pointer"
                />
                <span className="w-6 text-right font-bold text-accent">{weights.importance}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-medium">Urgency (W<sub>u</sub>)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.urgency}
                  onChange={(e) => updateWeight('urgency', e.target.value)}
                  className="w-28 h-1.5 cursor-pointer"
                />
                <span className="w-6 text-right font-bold text-accent">{weights.urgency}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-medium">Effort (W<sub>e</sub>)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.effort}
                  onChange={(e) => updateWeight('effort', e.target.value)}
                  className="w-28 h-1.5 cursor-pointer"
                />
                <span className="w-6 text-right font-bold text-accent">{weights.effort}</span>
              </div>
            </div>

            {/* Ranked Task items */}
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-[var(--border-card)] hover:border-accent text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {
                        playSuccess();
                        markComplete(task.id);
                      }}
                      className="rounded text-accent focus:ring-accent cursor-pointer"
                    />
                    <span className={`truncate font-medium ${task.completed ? 'line-through text-slate-400' : 'text-[var(--text-main)]'}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-accent px-2 py-0.5 rounded-full bg-[var(--accent-soft)] shrink-0">
                    {task.aiScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Dynamic weighted queue</span>
            <span className="text-accent font-semibold">Live re-sorted</span>
          </div>
        </motion.div>

      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </motion.div>
  );
};

export default DashboardOverview;
