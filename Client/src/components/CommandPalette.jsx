import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  LayoutDashboard, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Users, 
  Sliders, 
  Trophy, 
  MessageSquare, 
  Settings as SettingsIcon,
  Plus, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  X,
  CheckCircle2
} from 'lucide-react';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

export const CommandPalette = ({ isOpen, onClose, onOpenAddTask }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useAppearance();
  const { toggleMute, isMuted, playClick, playToggle } = useSound();
  const { tasks } = useTasks();
  const { user } = useAuth();
  const canManage = user?.role === 'Admin' || user?.role === 'Manager';

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks (Kanban)', path: '/tasks', icon: Kanban },
    { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    ...(canManage ? [{ label: 'Team Collaboration', path: '/team', icon: Users }] : []),
    { label: 'AI Prioritizer', path: '/prioritizer', icon: Sliders },
    { label: 'Rewards & XP', path: '/rewards', icon: Trophy },
    { label: 'Team Chat', path: '/chat', icon: MessageSquare },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const filteredNav = quickNav.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const handleSelectNav = (path) => {
    playClick();
    navigate(path);
    onClose();
  };

  const handleToggleTheme = () => {
    playToggle(!isDark);
    toggleTheme();
  };

  const handleToggleSound = () => {
    toggleMute();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            playClick();
            onClose();
          }}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Search Input Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results Body */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-4">
            
            {/* Quick Actions */}
            <div>
              <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                {canManage && (
                  <button
                    onClick={() => {
                      playClick();
                      onClose();
                      onOpenAddTask();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Plus size={16} className="text-accent" />
                      <span>Create New Task</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">N</span>
                  </button>
                )}

                <button
                  onClick={handleToggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
                    <span>Switch to {isDark ? 'Light' : 'Dark'} Mode</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">T</span>
                </button>

                <button
                  onClick={handleToggleSound}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {isMuted ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-emerald-500" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'} UI Sounds</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">M</span>
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Navigate
              </p>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelectNav(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={16} className="text-slate-400" />
                        <span>{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tasks Found */}
            {filteredTasks.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Matching Tasks
                </p>
                <div className="space-y-0.5">
                  {filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectNav('/tasks')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CheckCircle2 size={15} className="text-accent shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer info */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0E131F] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Use ↑↓ to navigate</span>
            <span>FlowZen Command Center</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;

