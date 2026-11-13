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
  ChevronRight,
  KeyRound,
  Copy,
  Trash2
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import AddTaskModal from '../components/ui/AddTaskModal';
import Portal from '../components/ui/Portal';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { selectWorkload } from '../lib/metrics';

export const TeamPage = () => {
  const { teamMembers, addTeamMember, tasks, removeTeamMember } = useTasks();
  const { isAdmin, user } = useAuth();
  const { playClick, playDrawer, playSuccess } = useSound();
  const navigate = useNavigate();

  const [selectedMember, setSelectedMember] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null); // { name, tempPassword }
  const [copied, setCopied] = useState(false);

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

  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || inviteLoading) return;
    setInviteLoading(true);
    const result = await addTeamMember({ name, email, role });
    setInviteLoading(false);
    if (result?.success === false) return; // error already toasted; keep modal open
    setName('');
    setEmail('');
    setIsInviteOpen(false);
    playSuccess();
  };

  const memberTasks = selectedMember
    ? tasks.filter(t => (t.assignees && t.assignees.some(a => a?.id === selectedMember.id || a?.name === selectedMember.name)) || t.assignee?.id === selectedMember.id || t.assignee?.name === selectedMember.name)
    : [];

  // Real workload per member: open assigned tasks / capacity (5 = 100%).
  const workloadOf = (member) => selectWorkload(tasks, member.id);

  // Admin may reset any member (except self); Manager only own Employees.
  // Backend enforces the same rule — this only controls visibility.
  const canResetPassword = (member) => {
    if (!member || member.id === user?.id) return false;
    if (user?.role === 'Admin') return true;
    if (user?.role === 'Manager') {
      return member.role === 'Employee' && member.createdBy === user?.id;
    }
    return false;
  };

  const handleResetPassword = async () => {
    if (!selectedMember || resetLoading) return;
    setResetLoading(true);
    try {
      const res = await apiClient.post(`/users/${selectedMember.id}/reset-password`);
      if (res.data?.success && res.data?.tempPassword) {
        setResetResult({ name: selectedMember.name, tempPassword: res.data.tempPassword });
        setCopied(false);
        toast.success(`Password reset for ${selectedMember.name}`);
      } else {
        toast.error(res.data?.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!resetResult?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(resetResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the password manually');
    }
  };

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

        {(user?.role === 'Admin' || user?.role === 'Manager') && (
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
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {teamMembers.length === 0 && (
          <div className="col-span-full card-base">
            <EmptyState
              icon={Users}
              title="No team members yet"
              hint="Members appear here once accounts are created in this workspace."
            />
          </div>
        )}
        {teamMembers.map((member) => {
          const wl = workloadOf(member);
          return (
          <div
            key={member.id}
            onClick={() => handleSelectMember(member)}
            className="card-base card-hover p-4 sm:p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Member Row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <Avatar name={member.name} src={member.avatar} size={48} className="ring-2 ring-[var(--border-card)] group-hover:scale-105 transition-transform" />

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

              {/* Workload Bar — real open assigned tasks / capacity (5) */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-muted)] text-[11px]">Workload</span>
                  <span className={`text-[11px] font-bold ${wl.percent >= 100 ? 'text-rose-500' : 'text-[var(--text-main)]'}`}>
                    {wl.open}/{wl.capacity} open · {wl.percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${wl.percent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${wl.percent >= 100 ? 'bg-rose-500' : 'bg-accent'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{wl.open} active · {wl.completed} done</span>
              <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ChevronRight size={13} />
              </span>
            </div>
          </div>
          );
        })}
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
                className="fixed inset-0 bg-black/45 backdrop-blur-sm"
              />

              {/* Slide-in Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-full sm:max-w-md h-full surface-modal shadow-2xl flex flex-col justify-between p-4 sm:p-6 z-10 overflow-y-auto"
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
                    <div className="inline-block mx-auto mb-3">
                      <Avatar name={selectedMember.name} src={selectedMember.avatar} size={80} className="ring-4 ring-[var(--accent-soft)]" />
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
                  {(() => {
                    const wl = workloadOf(selectedMember);
                    return (
                      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2 mb-6">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-[var(--text-muted)]">Open Tasks / Capacity</span>
                          <span className="text-accent">{wl.open}/{wl.capacity} · {wl.percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${wl.percent}%` }}
                            className="h-full rounded-full bg-accent"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--text-muted)] pt-1">
                          <span>{memberTasks.length} assigned tasks</span>
                          <span>{wl.completed} completed</span>
                        </div>
                      </div>
                    );
                  })()}

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
                      navigate(`/chat?dm=${selectedMember.id}`);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare size={15} />
                    <span>Message</span>
                  </button>
                </div>

                {/* Password reset — Admin: any member, Manager: own Employees */}
                {canResetPassword(selectedMember) && (
                  <button
                    onClick={() => {
                      playClick();
                      handleResetPassword();
                    }}
                    disabled={resetLoading}
                    className="mt-3 w-full py-2.5 px-4 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <KeyRound size={15} />
                    <span>{resetLoading ? 'Resetting…' : 'Reset Password'}</span>
                  </button>
                )}

                {/* Delete member — Admin: any, Manager: own Employees (not self) */}
                {canResetPassword(selectedMember) && selectedMember.id !== user?.id && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Remove ${selectedMember.name} from the team? Their account will be deactivated.`)) return;
                      playClick();
                      const res = await removeTeamMember(selectedMember.id);
                      if (res?.success) handleCloseDrawer();
                    }}
                    className="mt-2 w-full py-2.5 px-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={15} />
                    <span>Remove Member</span>
                  </button>
                )}

              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Portal>
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-md glass-strong rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Invite Team Member</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Add a new collaborator to your FlowZen workspace.</p>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="maya@flowzen.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Employee', label: 'Employee', desc: 'Tasks & Lifecycle' },
                      { value: 'Manager', label: 'Manager', desc: 'Assign & Capacity' },
                      { value: 'Admin', label: 'Admin', desc: 'Full Control' },
                    ].map((opt) => {
                      const active = role === opt.value;
                      const disabled = user?.role === 'Manager' && opt.value !== 'Employee';
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={disabled}
                          onClick={() => setRole(opt.value)}
                          className={`px-2 py-2.5 rounded-xl border text-center transition-all ${
                            active
                              ? 'border-accent bg-[var(--accent-soft)] ring-1 ring-accent'
                              : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-accent/50'
                          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`block text-xs font-bold ${active ? 'text-accent' : 'text-[var(--text-main)]'}`}>{opt.label}</span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-main)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-60"
                  >
                    {inviteLoading ? 'Creating…' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Reset Password Result — temp password shown ONCE */}
      {resetResult && (
        <Portal>
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-sm glass-strong rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setResetResult(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Password Reset</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                New temporary password for <span className="font-bold text-[var(--text-main)]">{resetResult.name}</span>:
              </p>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] mb-3">
                <code className="flex-1 text-sm font-bold text-[var(--text-main)] tracking-wide">
                  {resetResult.tempPassword}
                </code>
                <button
                  onClick={handleCopyTempPassword}
                  className="p-2 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-accent transition-colors"
                  title="Copy password"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-300 mb-4">
                Share this securely — it is shown only once. The member must set a new password on next login.
              </p>

              <button
                onClick={() => setResetResult(null)}
                className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-95 transition-opacity"
              >
                Done
              </button>
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
