import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Plus
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import AddTaskModal from '../components/ui/AddTaskModal';

export const CalendarPage = () => {
  const { tasks, markComplete } = useTasks();
  const navigate = useNavigate();
  const { weekStartsOn } = useAppearance();
  const { playClick, playSuccess } = useSound();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); // November 2026
  const [selectedDay, setSelectedDay] = useState(2);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month navigation
  const prevMonth = () => {
    playClick();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    playClick();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Week header ordering based on weekStartsOn preference
  const weekDays = weekStartsOn === 'monday' 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const offset = weekStartsOn === 'monday' 
    ? (firstDayIndex === 0 ? 6 : firstDayIndex - 1)
    : firstDayIndex;

  // Calendar cells
  const calendarCells = [];
  for (let i = 0; i < offset; i++) {
    calendarCells.push({ day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    // Check tasks due on this date (formatted as 2026-11-02)
    const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = d.toString().padStart(2, '0');
    const dateFormatted = `${currentDate.getFullYear()}-${monthStr}-${dayStr}`;

    const dayTasks = tasks.filter(t => t.deadline === dateFormatted);
    calendarCells.push({ day: d, date: dateFormatted, tasks: dayTasks });
  }

  // Selected date's tasks
  const selectedDateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
  const selectedDayTasks = tasks.filter(t => t.deadline === selectedDateStr);

  // Coming up: next OPEN tasks by due date (completed excluded)
  const todayKey = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
  const upcomingTasks = tasks
    .filter(t => !t.completed && t.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Project Calendar
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Visualize deadlines and sprint milestones across the month.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Month Calendar Grid (2 Cols) */}
        <div className="md:col-span-2 card-base p-3.5 sm:p-6">
          
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-[var(--border-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-[var(--border-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {weekDays.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell.day) {
                return <div key={`empty-${idx}`} className="h-14 sm:h-20 rounded-lg sm:rounded-xl bg-slate-100/40 dark:bg-slate-900/20 border border-[var(--border-subtle)]" />;
              }

              const isSelected = selectedDay === cell.day;
              const hasTasks = cell.tasks && cell.tasks.length > 0;

              return (
                <div
                  key={`day-${cell.day}`}
                  onClick={() => {
                    playClick();
                    setSelectedDay(cell.day);
                  }}
                  className={`h-14 sm:h-20 p-1 sm:p-2 rounded-lg sm:rounded-xl calendar-day-cell cursor-pointer flex flex-col justify-between ${
                    isSelected ? 'is-selected font-bold ring-2 ring-accent' : ''
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs block ${isSelected ? 'text-accent font-extrabold' : 'text-[var(--text-main)]'}`}>
                    {cell.day}
                  </span>

                  {/* Task indicator chips */}
                  {hasTasks && (
                    <>
                      {/* Mobile view: Dot badge */}
                      <div className="sm:hidden flex items-center justify-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {cell.tasks.length > 1 && (
                          <span className="text-[8px] font-bold text-accent">+{cell.tasks.length - 1}</span>
                        )}
                      </div>

                      {/* Desktop / tablet view: Detailed task pills */}
                      <div className="hidden sm:block space-y-1 overflow-hidden">
                        {cell.tasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold truncate bg-accent text-white leading-tight"
                          >
                            {t.title}
                          </div>
                        ))}
                        {cell.tasks.length > 2 && (
                          <span className="text-[9px] text-[var(--text-muted)] block">
                            +{cell.tasks.length - 2} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected-Day Tasks Panel & Coming Up (1 Col) */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Selected-Day Panel */}
          <div className="card-base p-4 sm:p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-card)]">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                  Selected Date
                </span>
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  {monthNames[currentDate.getMonth()]} {selectedDay}, {currentDate.getFullYear()}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]">
                {selectedDayTasks.length} tasks
              </span>
            </div>

            <div className="space-y-3">
              {selectedDayTasks.map((task) => {
                const isOverdue = !task.completed && task.deadline && task.deadline < todayKey;
                return (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900/50 shadow-xs text-xs flex items-center justify-between gap-2 cursor-pointer hover:border-accent transition-colors ${isOverdue ? 'border-rose-400/60' : 'border-[var(--border-card)]'}`}
                >
                  <div className="truncate">
                    <span className={`block font-semibold truncate ${task.completed ? 'line-through text-slate-400' : isOverdue ? 'text-rose-500' : 'text-[var(--text-main)]'}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {task.assignees?.map(a=>a.name).join(', ') || task.assignee?.name || 'Unassigned'}{isOverdue ? ' · Overdue' : ''}
                    </span>
                  </div>

                  {!task.completed && task.backendStatus !== 'Review' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); playSuccess(); markComplete(task.id); }}
                      className="p-1.5 rounded-lg transition-colors border border-[var(--border-card)] text-slate-400 hover:text-emerald-500 shrink-0"
                      title="Mark Done"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                </div>
                );
              })}

              {selectedDayTasks.length === 0 && (
                <div className="text-center py-6">
                  <CalendarIcon size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-xs text-[var(--text-muted)]">No deadlines scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>

          {/* Coming Up Deadlines */}
          <div className="card-base p-6">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-3">
              Coming Up
            </h3>

            <div className="space-y-2.5">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-medium text-[var(--text-main)] block truncate">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Due {t.deadline}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-accent shrink-0">
                    {t.tags?.[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </div>
  );
};

export default CalendarPage;

