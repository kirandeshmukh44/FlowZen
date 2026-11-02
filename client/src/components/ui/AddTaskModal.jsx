import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Calendar, User, Clock, Flag, Check, Search } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../hooks/useSound';
import { Portal } from './Portal';
import { computeAIScore } from '../../utils/aiScore';
import confetti from 'canvas-confetti';

export const AddTaskModal = ({ isOpen, onClose }) => {
  const { teamMembers, addTask } = useTasks();
  const { user } = useAuth();
  const { playClick, playSuccess } = useSound();

  const isAdmin = user?.role === 'Admin';
  const availableMembers = useMemo(() => {
    if (isAdmin) return teamMembers;
    return teamMembers.filter((m) => m.role === 'Employee');
  }, [isAdmin, teamMembers]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [deadline, setDeadline] = useState('');
  const [importance, setImportance] = useState(8);
  const [urgency, setUrgency] = useState(7);
  const [effort, setEffort] = useState(3);
  const [category, setCategory] = useState('None');
  const [createAnother, setCreateAnother] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const titleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setSelectedIds([]);
    setSearch('');
    setDeadline('');
    setImportance(8);
    setUrgency(7);
    setEffort(3);
    setCategory('None');
    setErrors({});
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (user?.role === 'Employee') return null;

  const toggleMember = (id) => {
    playClick();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeMember = (id) => {
    playClick();
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const addWholeTeam = () => {
    playClick();
    setSelectedIds(availableMembers.map((m) => m.id));
  };

  const setQuickDate = (days) => {
    playClick();
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().slice(0, 10));
  };

  const CATEGORY_BG = {
    Design: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
    Backend: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    Database: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
    Quality: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    Accessibility: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    Responsive: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
    Algorithm: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
    None: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  };

  const CATEGORIES = ['Design', 'Backend', 'Database', 'Quality', 'Accessibility', 'Responsive', 'Algorithm', 'None'];

  const previewScore = computeAIScore(
    { importance: Number(importance), urgency: Number(urgency), effort: Number(effort), deadline },
    { importance: 100, urgency: 100, effort: 100 }
  );

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (selectedIds.length === 0) e.assign = 'Assign to at least one person';
    if (!deadline) e.deadline = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const selectedMembers = selectedIds
      .map((id) => availableMembers.find((m) => m.id === id))
      .filter(Boolean);
    const primary = selectedMembers[0] || availableMembers[0];
    addTask({
      title: title.trim(),
      description: description.trim(),
      assignee: primary,
      assignees: selectedMembers,
      deadline,
      importance: Number(importance),
      urgency: Number(urgency),
      effort: Number(effort),
      tags: category === 'None' ? [] : [category],
      tagColor: category.toLowerCase(),
    });
    playSuccess();
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (err) {}
    setLoading(false);
    if (createAnother) {
      setTitle('');
      setDescription('');
      setSelectedIds([]);
      setSearch('');
      setDeadline('');
      setImportance(8);
      setUrgency(7);
      setEffort(3);
      setCategory('None');
      setErrors({});
      titleRef.current?.focus();
    } else {
      onClose();
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const filteredMembers = availableMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onMouseDown={handleBackdrop}>
        <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-2xl glass-strong shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0">
            <div>
              <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>AI-Assisted Task Planner</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-main)] mt-0.5">Create New Task</h2>
            </div>
            <button onClick={() => { playClick(); onClose(); }} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Task Title
            </label>
            <input
              ref={titleRef}
              type="text"
              required
              placeholder="e.g. Implement Responsive Kanban columns"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief context and acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Assign to */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase">
                Assign to <span className="text-rose-500">*</span>
              </label>
              <button type="button" onClick={addWholeTeam} className="text-[11px] font-bold text-[var(--accent)] hover:underline">
                Add whole team
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedIds.map((id) => {
                const m = availableMembers.find((x) => x.id === id);
                if (!m) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-main)]">
                    <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                    {m.name}
                    <button type="button" onClick={() => removeMember(id)} className="hover:text-rose-500">
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
              {filteredMembers.map((m) => {
                const selected = selectedIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--accent-soft)]/50'
                    }`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                    <span className="flex-1 text-left text-[var(--text-main)]">{m.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{m.role}</span>
                    {selected && <Check size={14} className="text-[var(--accent)]" />}
                  </button>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="px-3 py-2 text-xs text-[var(--text-muted)]">No members found</div>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              {selectedIds.length <= 1
                ? '1 person = Private task, no discussion thread'
                : 'A shared discussion thread will be created'}
            </p>
            {errors.assign && <p className="text-xs text-rose-500 mt-1">{errors.assign}</p>}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Due date <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setQuickDate(0)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                Today
              </button>
              <button type="button" onClick={() => setQuickDate(1)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                Tomorrow
              </button>
              <button type="button" onClick={() => setQuickDate(7)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                Next week
              </button>
            </div>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {errors.deadline && <p className="text-xs text-rose-500 mt-1">{errors.deadline}</p>}
          </div>

          {/* Priority */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Priority</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-white">
                AI score {previewScore}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">Importance</span>
                  <span className="font-bold text-[var(--text-main)]">{importance}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">Urgency</span>
                  <span className="font-bold text-[var(--text-main)]">{urgency}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">Effort (hours)</span>
                  <span className="font-bold text-[var(--text-main)]">{effort}h</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={effort}
                  onChange={(e) => setEffort(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {['Design', 'Backend', 'Database', 'Quality', 'Accessibility', 'Responsive', 'Algorithm', 'None'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => { playClick(); setCategory(c); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === c ? 'ring-2 ring-[var(--accent)] scale-105' : 'opacity-70 hover:opacity-100'
                  } ${
                    {
                      Design: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
                      Backend: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
                      Database: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
                      Quality: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
                      Accessibility: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
                      Responsive: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
                      Algorithm: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
                      None: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
                    }[c]
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          </form>

          {/* Sticky footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--surface-card)]">
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Create another
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { playClick(); onClose(); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-95 shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save & Prioritize'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AddTaskModal;
