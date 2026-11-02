import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  User,
  Sparkles,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Check,
  MoreVertical,
  Flag
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSound } from '../hooks/useSound';
import AddTaskModal from '../components/ui/AddTaskModal';

export const KanbanPage = () => {
  const { tasks, moveTaskColumn, markComplete, teamMembers } = useTasks();
  const { playClick, playDragPickup, playDrop, playSuccess } = useSound();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilterTag, setActiveFilterTag] = useState('All');
  const [sortBy, setSortBy] = useState('aiScore');
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
    { id: 'review', title: 'Review', color: 'bg-purple-500' },
    { id: 'done', title: 'Done', color: 'bg-emerald-500' },
  ];

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    if (activeFilterTag === 'All') return true;
    return t.tags?.includes(activeFilterTag);
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'aiScore') return b.aiScore - a.aiScore;
    if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
    return 0;
  });

  const handleDragStart = (e, taskId) => {
    playDragPickup();
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (colId) => {
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      playDrop();
      if (targetColId === 'done') {
        playSuccess();
      }
      moveTaskColumn(taskId, targetColId);
    }
  };

  const tagsList = ['All', 'Design', 'Backend', 'Database', 'Accessibility', 'Responsive', 'Algorithm'];

  return (
    <div className="space-y-6">

      {/* ===================== KANBAN HEADER & FILTER CONTROLS ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Tasks Kanban Board
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Manage lifecycle progression with live drag-and-drop and AI weighted scoring.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl card-base">
        {/* Category Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tagsList.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                playClick();
                setActiveFilterTag(tag);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${activeFilterTag === tag
                ? 'bg-accent text-white shadow-2xs font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)] font-medium flex items-center gap-1">
            <ArrowUpDown size={13} /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              playClick();
              setSortBy(e.target.value);
            }}
            className="px-2.5 py-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-main)] focus:outline-none"
          >
            <option value="aiScore">AI Score (Highest first)</option>
            <option value="deadline">Due Date</option>
          </select>
        </div>
      </div>

      {/* ===================== KANBAN 4-COLUMN BOARD ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = sortedTasks.filter((t) => t.column === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`kanban-column-tray p-4 min-h-[500px] flex flex-col justify-between transition-colors duration-200 ${
                isOver ? 'ring-2 ring-accent bg-[var(--accent-soft)]' : ''
              }`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-card)]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                      {col.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      playClick();
                      setIsAddModalOpen(true);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Task Cards Container */}
                <div className="space-y-3 min-h-[380px]">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      layout
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="p-4 rounded-2xl kanban-task-card cursor-grab active:cursor-grabbing group relative"
                    >
                      {/* Tags & AI Score */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.tagColor === 'cyan' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                          task.tagColor === 'purple' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                            task.tagColor === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                          {task.tags?.[0] || 'General'}
                        </span>

                        <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-[var(--accent-soft)] flex items-center gap-1">
                          <Sparkles size={10} /> {task.aiScore}%
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-[var(--text-main)] mb-1 leading-snug">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-3">
                        {task.description}
                      </p>

                      {/* Footer: Due date + Assignee */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-card)] text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={11} /> {task.deadline}
                        </span>

                        <div className="flex items-center gap-2">
                          {col.id !== 'done' && (
                            <button
                              onClick={() => {
                                playSuccess();
                                markComplete(task.id);
                              }}
                              className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)] hover:bg-accent hover:text-white text-accent font-semibold transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                              title="Mark Complete"
                            >
                              <Check size={11} /> Done
                            </button>
                          )}
                          <img
                            src={task.assignee?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'}
                            alt={task.assignee?.name}
                            title={task.assignee?.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-[var(--border-card)] rounded-xl flex items-center justify-center text-xs text-[var(--text-muted)]">
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>

              {/* Column Footer */}
              <div className="pt-2 text-[10px] text-[var(--text-muted)] text-center">
                Drag card to shift state
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </div>
  );
};

export default KanbanPage;
