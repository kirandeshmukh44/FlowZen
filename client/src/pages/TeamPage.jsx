import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  X,
  Check,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Flame,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import AddTaskModal from '../components/ui/AddTaskModal';
import Portal from '../components/ui/Portal';

export const TeamPage = () => {
  const { teamMembers, addTeamMember, tasks } = useTasks();
  const { isAdmin } = useAuth();
  const { playClick, playDrawer, playSuccess } = useSound();
  const navigate = useNavigate();

  const [selectedMember, setSelectedMember] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Invite state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');

  const handleSelectMember = (member) => {
    playDrawer(true);
    setSelectedMember(member);
  };

  const handleCloseDrawer = () => {
    playDrawer(false);
    setSelectedMember(null);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    addTeamMember({ name, email, role });
    setName('');
    setEmail('');
    setIsInviteOpen(false);
    playSuccess();
  };

  const memberTasks = selectedMember
    ? tasks.filter(t => (t.assignees && t.assignees.some(a => a?.id === selectedMember.id || a?.name === selectedMember.name)) || t.assignee?.id === selectedMember.id || t.assignee?.name === selectedMember.name)
    : [];

  return (
    <div className="space-y-6 relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Team & Capacity Management
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            View member profiles, monitor live bandwidth, and assign tasks across sprints.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsInviteOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => handleSelectMember(member)}
            className="card-base card-hover p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Member Row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[var(--border-card)] group-hover:scale-105 transition-transform"
                  />
                  {member.online && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card)]" />
                  )}
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${member.role === 'Admin'
                  ? 'bg-accent text-white shadow-2xs'
                  : member.role === 'Manager'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                  {member.role}
                </span>
              </div>

              {/* Info */}
              <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-accent transition-colors">
                {member.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] truncate mb-4">
                {member.email}
              </p>

              {/* Workload Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-muted)] text-[11px]">Workload</span>
                  <span className={`text-[11px] font-bold ${member.capacity > 80 ? 'text-rose-500' : 'text-[var(--text-main)]'}`}>
                    {member.capacity}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${member.capacity}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${member.capacity > 80 ? 'bg-rose-500' : 'bg-accent'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{member.tasksCount || 4} active tasks</span>
              <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== RIGHT-SIDE MEMBER DRAWER ===================== */}
      <AnimatePresence>
        {selectedMember && (
          <Portal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex justify-end">
              {/* Backdrop with blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseDrawer}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Slide-in Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-full max-w-md h-full surface-modal shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto"
              >
                <div>
                  {/* Drawer Close Button */}
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)] mb-6">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Member Profile
                    </span>
                    <button
                      onClick={handleCloseDrawer}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Profile Avatar & Header */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block mx-auto mb-3">
                      <img
                        src={selectedMember.avatar}
                        alt={selectedMember.name}
                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[var(--accent-soft)]"
                      />
                      {selectedMember.online && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card)]" />
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-main)]">
                      {selectedMember.name}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                      {selectedMember.email}
                    </p>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent text-white">
                      {selectedMember.role}
                    </span>
                  </div>

                  {/* Workload Capacity Stats */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-card)] space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[var(--text-muted)]">Sprint Workload Capacity</span>
                      <span className="text-accent">{selectedMember.capacity}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${selectedMember.capacity}%` }}
                        className="h-full rounded-full bg-accent"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] pt-1">
                      <span>{memberTasks.length} Assigned tasks</span>
                      <span>Level: {selectedMember.level || 'Intermediate'}</span>
                    </div>
                  </div>

                  {/* Assigned Tasks List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Assigned Tasks ({memberTasks.length})
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {memberTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-xs flex items-center justify-between"
                        >
                          <div className="truncate pr-2">
                            <span className={`block font-semibold truncate ${t.completed ? 'line-through text-slate-400' : 'text-[var(--text-main)]'}`}>
                              {t.title}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">Due {t.deadline}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-accent shrink-0">
                            {t.status}
                          </span>
                        </div>
                      ))}
                      {memberTasks.length === 0 && (
                        <p className="text-xs text-[var(--text-muted)] text-center py-4">
                          No active tasks currently assigned.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawer Bottom Actions: Assign task & Message */}
                <div className="pt-6 border-t border-[var(--border-card)] grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => {
                      playClick();
                      setIsAddTaskOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-[var(--border-card)] hover:border-accent text-xs font-bold text-[var(--text-main)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Assign Task</span>
                  </button>

                  <button
                    onClick={() => {
                      playClick();
                      handleCloseDrawer();
                      navigate('/chat');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare size={15} />
                    <span>Message</span>
                  </button>
                </div>

              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Portal>
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-md surface-modal rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
              <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Invite Team Member</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Add a new collaborator to your FlowZen workspace.</p>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="maya@flowzen.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none"
                  >
                    <option value="Employee">Employee (Tasks & Lifecycle)</option>
                    <option value="Manager">Manager (Assign & Capacity)</option>
                    <option value="Admin">Admin (Full Control)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />

    </div>
  );
};

export default TeamPage;
