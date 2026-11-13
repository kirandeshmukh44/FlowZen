import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, Zap, AlertTriangle, CalendarClock,
  MessageSquare, Plus, UserPlus, ArrowRight, ClipboardCheck, Trash2,
} from 'lucide-react';
import AddTaskModal from '../../components/ui/AddTaskModal';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { KpiCard, SectionCard, TaskRow } from './shared';
import { useDashboardData } from './useDashboard';
import { useTasks } from '../../context/TaskContext';
import { useSound } from '../../hooks/useSound';

const ManagerDashboard = () => {
  const d = useDashboardData();
  const { counts, overdue, dueSoon, awaitingApproval, workload, user } = d;
  const { moveTaskColumn, approveTask, sendBackTask, deleteTask } = useTasks();
  const [approvingId, setApprovingId] = useState(null);

  const handleDelete = (t) => {
    if (window.confirm(`Delete "${t.title}"? This cannot be undone.`)) deleteTask(t.id);
  };
  const [sendBackTarget, setSendBackTarget] = useState(null);
  const [sendBackNote, setSendBackNote] = useState('');

  const handleApprove = async (t) => {
    setApprovingId(t.id);
    await approveTask(t.id);
    setApprovingId(null);
  };

  const handleSendBack = async () => {
    if (!sendBackTarget) return;
    setApprovingId(sendBackTarget.id);
    await sendBackTask(sendBackTarget.id, sendBackNote.trim());
    setApprovingId(null);
    setSendBackTarget(null);
    setSendBackNote('');
  };
  const { playClick } = useSound();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // "Unanswered queries" — open task threads aren't queryable cheaply; use
  // due-soon + review items as the actionable queue instead.
  const reviewQueue = awaitingApproval;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Team Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Welcome back{user?.name ? `, ${user.name}` : ''} — your team's workload and approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/team"
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-[var(--border-card)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-1.5"
          >
            <UserPlus size={15} /> Assign
          </Link>
          <button
            onClick={() => { playClick(); setIsAddOpen(true); }}
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <KpiCard icon={Clock} label="Team Open" value={counts.open} accent sub="Across your reports" />
        <KpiCard icon={CheckCircle2} label="Completed" value={counts.completed} sub={`${counts.progressPercent}% closed`} />
        <KpiCard icon={Zap} label="In Progress" value={counts.inProgress} sub="Being worked on" />
        <KpiCard icon={ClipboardCheck} label="To Review" value={reviewQueue.length} sub="Awaiting your approval" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <SectionCard title="Review & Approve" className="lg:col-span-2" action={<span className="text-[11px] font-bold text-accent">{reviewQueue.length} pending</span>}>
          {reviewQueue.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="All caught up" hint="Tasks submitted for review will appear here." />
          ) : (
            <div className="space-y-2">
              {reviewQueue.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-card)]">
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[var(--text-main)] truncate">{t.title}</span>
                    <span className="block text-[10px] text-[var(--text-muted)]">
                      {t.assignees?.map((a) => a.name).join(', ') || 'Unassigned'} · Submitted for review
                      {t.reviewNote ? ` · "${t.reviewNote}"` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleApprove(t)}
                    disabled={approvingId === t.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {approvingId === t.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setSendBackTarget(t)}
                    disabled={approvingId === t.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
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

        <div className="space-y-4 sm:space-y-6">
          <SectionCard title="Team Workload">
            {workload.length === 0 ? (
              <EmptyState icon={UserPlus} title="No reports yet" hint="Employees you create appear here." />
            ) : (
              <div className="space-y-2.5">
                {workload.filter((w) => w.member.role === 'Employee').slice(0, 6).map(({ member, open, percent }) => (
                  <div key={member.id} className="flex items-center gap-2.5">
                    <Avatar name={member.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-[var(--text-main)] truncate">{member.name}</span>
                        <span className={percent >= 100 ? 'text-rose-500' : 'text-[var(--text-muted)]'}>{open}/5</span>
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

          <SectionCard title="Due Soon" action={<CalendarClock size={14} className="text-accent" />}>
            {dueSoon.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing due soon" hint="Tasks due in the next 3 days show up here." />
            ) : (
              <div className="space-y-2">
                {dueSoon.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onDelete={handleDelete} />)}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Overdue" action={<AlertTriangle size={14} className="text-rose-500" />}>
            {overdue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No overdue tasks" />
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onDelete={handleDelete} />)}
              </div>
            )}
          </SectionCard>

          <Link
            to="/chat"
            className="card-base p-4 flex items-center gap-3 hover:border-accent transition-colors group"
          >
            <span className="p-2 rounded-xl bg-[var(--accent-soft)] text-accent"><MessageSquare size={16} /></span>
            <div className="flex-1">
              <span className="text-xs font-bold text-[var(--text-main)] block">Message your team</span>
              <span className="text-[10px] text-[var(--text-muted)]">Direct messages and task threads</span>
            </div>
            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <AddTaskModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Send-back note modal */}
      {sendBackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSendBackTarget(null)}>
          <div className="card-base p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[var(--text-main)]">Send back for rework</h3>
            <p className="text-xs text-[var(--text-muted)] truncate">{sendBackTarget.title}</p>
            <textarea
              value={sendBackNote}
              onChange={(e) => setSendBackNote(e.target.value)}
              placeholder="Note for the employee (optional)…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSendBackTarget(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSendBack} disabled={approvingId === sendBackTarget.id} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold disabled:opacity-50">
                {approvingId === sendBackTarget.id ? 'Sending…' : 'Send back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ManagerDashboard;
