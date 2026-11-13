// src/lib/metrics.js
// Pure selectors — the single source of truth for every number shown in the
// UI. All functions take the normalized task list from TaskContext
// (see api/adapters.js normalizeTask) and return plain data.
//
// Definitions (applied everywhere):
//   cancelled : backendStatus === 'Cancelled' — excluded from EVERY count.
//   open      : not completed AND not cancelled.
//   completed : backendStatus === 'Completed' (task.completed === true).

import { calculateUrgency } from '../utils/aiScore';

export const isCancelled = (t) => t?.backendStatus === 'Cancelled' || t?.status === 'Cancelled';
export const isCompleted = (t) => t?.completed === true || t?.backendStatus === 'Completed';
export const isOpen = (t) => !isCompleted(t) && !isCancelled(t);

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Effective completion timestamp: completedAt, else updatedAt for completed tasks.
export const completedAtOf = (t) => {
  if (!isCompleted(t)) return null;
  return toDate(t.completedAt) || toDate(t.updatedAt) || toDate(t.createdAt);
};

// ---------------------------------------------------------------------------
// Role scoping
// ---------------------------------------------------------------------------
// Admin    -> every task in the workspace
// Manager  -> tasks they created + tasks assigned to their reports
//             (team member.createdBy === manager.id)
// Employee -> only tasks they are assigned to
export function scopeTasksForRole(tasks, { user, teamMembers = [] } = {}) {
  if (!user) return [];
  const uid = String(user.id);
  if (user.role === 'Admin') return tasks;
  if (user.role === 'Manager') {
    const reportIds = new Set(
      teamMembers.filter((m) => m?.createdBy && String(m.createdBy) === uid).map((m) => String(m.id))
    );
    return tasks.filter((t) => {
      if (t.createdBy && String(t.createdBy) === uid) return true;
      const mine = (t.assignees || []).some((a) => a && String(a.id) === uid);
      if (mine) return true;
      return (t.assignees || []).some((a) => a && reportIds.has(String(a.id)));
    });
  }
  // Employee
  return tasks.filter((t) => (t.assignees || []).some((a) => a && String(a.id) === uid)
    || (t.assignee && String(t.assignee.id) === uid));
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------
export function selectTaskCounts(tasks = []) {
  const live = tasks.filter((t) => !isCancelled(t));
  const open = live.filter(isOpen);
  const completed = live.filter(isCompleted);
  const now = Date.now();
  const overdue = open.filter((t) => {
    const d = toDate(t.deadline);
    return d && d.getTime() < now;
  });
  return {
    total: live.length,
    cancelled: tasks.length - live.length,
    open: open.length,
    completed: completed.length,
    inProgress: live.filter((t) => t.backendStatus === 'In Progress').length,
    inReview: live.filter((t) => t.backendStatus === 'Review' || t.backendStatus === 'On Hold').length,
    backlog: live.filter((t) => t.backendStatus === 'Pending').length,
    overdue: overdue.length,
    dueSoon: selectDueSoon(tasks, 3).length,
    awaitingApproval: live.filter(
      (t) => isCompleted(t) && t.completionApproved === false
    ).length,
    progressPercent: live.length ? Math.round((completed.length / live.length) * 100) : 0,
  };
}

export function selectOverdue(tasks = [], now = Date.now()) {
  return tasks
    .filter((t) => isOpen(t))
    .filter((t) => {
      const d = toDate(t.deadline);
      return d && d.getTime() < now;
    })
    .sort((a, b) => toDate(a.deadline) - toDate(b.deadline));
}

export function selectDueSoon(tasks = [], days = 3, now = Date.now()) {
  const horizon = now + days * 86400000;
  return tasks
    .filter((t) => isOpen(t))
    .filter((t) => {
      const d = toDate(t.deadline);
      return d && d.getTime() >= now && d.getTime() <= horizon;
    })
    .sort((a, b) => toDate(a.deadline) - toDate(b.deadline));
}

// Awaiting Approval = ONLY tasks sitting in Review (employee submitted,
// waiting for Admin/Manager approval). Completed-but-unapproved legacy
// tasks are excluded — they were self-approved before the workflow.
export function selectAwaitingApproval(tasks = []) {
  return tasks.filter((t) => !isCancelled(t) && t.backendStatus === 'Review');
}

// ---------------------------------------------------------------------------
// Per-day completions (last N days, zero-filled)
// ---------------------------------------------------------------------------
export function selectCompletedPerDay(tasks = [], days = 7, now = new Date()) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    result.push({ date: d, key: d.toISOString().slice(0, 10), label: d.toLocaleDateString([], { weekday: 'short' }), count: 0 });
  }
  const byKey = new Map(result.map((r) => [r.key, r]));
  for (const t of tasks) {
    if (!isCompleted(t)) continue;
    const at = completedAtOf(t);
    if (!at) continue;
    const key = localDayKey(at);
    if (byKey.has(key)) byKey.get(key).count += 1;
  }
  return result.map(({ date, key, label, count }) => ({ date, key, day: label, tasks: count }));
}

// Local calendar-day key — avoids UTC shifts (toISOString is UTC).
const localDayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// On-time rate: completed tasks finished on/before their deadline.
// Tasks WITHOUT a deadline are excluded. Returns null when no completed
// task has a deadline -> UI shows "No data" instead of a misleading 0%.
// ---------------------------------------------------------------------------
export function selectOnTimeRate(tasks = []) {
  const completed = tasks.filter(isCompleted);
  const withDeadline = completed.filter((t) => toDate(t.deadline));
  if (!withDeadline.length) return null; // -> UI shows "No data yet"
  const onTime = withDeadline.filter((t) => {
    const done = completedAtOf(t);
    const due = toDate(t.deadline);
    if (!done || !due) return false;
    return done.getTime() <= due.getTime() + 86400000; // same-day grace
  }).length;
  return Math.round((onTime / withDeadline.length) * 100);
}

// ---------------------------------------------------------------------------
// Status breakdown donut (cancelled excluded)
// ---------------------------------------------------------------------------
export function selectStatusBreakdown(tasks = []) {
  const live = tasks.filter((t) => !isCancelled(t));
  const count = (pred) => live.filter(pred).length;
  return [
    { name: 'Completed', value: count(isCompleted), color: 'var(--accent)' },
    { name: 'In Progress', value: count((t) => t.backendStatus === 'In Progress'), color: '#F59E0B' },
    { name: 'Review', value: count((t) => t.backendStatus === 'Review' || t.backendStatus === 'On Hold'), color: '#8B5CF6' },
    { name: 'Backlog', value: count((t) => t.backendStatus === 'Pending'), color: '#94A3B8' },
  ].filter((s) => s.value > 0);
}

// ---------------------------------------------------------------------------
// Workload per member: open assigned tasks / capacity (default 5 = 100%)
// ---------------------------------------------------------------------------
export const DEFAULT_CAPACITY = 5;

export function selectWorkload(tasks = [], memberId) {
  const uid = String(memberId);
  const mine = tasks.filter(
    (t) => isOpen(t) &&
      ((t.assignees || []).some((a) => a && String(a.id) === uid) ||
        (t.assignee && String(t.assignee.id) === uid))
  );
  const done = tasks.filter(
    (t) => isCompleted(t) &&
      ((t.assignees || []).some((a) => a && String(a.id) === uid) ||
        (t.assignee && String(t.assignee.id) === uid))
  );
  return {
    open: mine.length,
    completed: done.length,
    capacity: DEFAULT_CAPACITY,
    percent: Math.min(100, Math.round((mine.length / DEFAULT_CAPACITY) * 100)),
  };
}

export function workloadForAll(tasks = [], teamMembers = []) {
  return teamMembers.map((m) => ({ member: m, ...selectWorkload(tasks, m.id) }));
}

// ---------------------------------------------------------------------------
// Throughput for Analytics: cumulative completions bucketed by range,
// with the previous equal-length period overlaid.
// range: '7d' | '30d' | 'quarter' | 'year'
// ---------------------------------------------------------------------------
const RANGE_DAYS = { '7d': 7, '30d': 30, quarter: 90, year: 365 };
const RANGE_BUCKET = { '7d': 'day', '30d': 'day', quarter: 'week', year: 'month' };

export function selectThroughput(tasks = [], range = '30d', now = new Date()) {
  const days = RANGE_DAYS[range] || 30;
  const bucket = RANGE_BUCKET[range] || 'day';
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  const completions = tasks
    .filter(isCompleted)
    .map((t) => ({ at: completedAtOf(t) }))
    .filter((c) => c.at && c.at >= prevStart); // include all completions within visible window

  const bucketKey = (d) => {
    if (bucket === 'month') return localDayKey(d).slice(0, 7);
    if (bucket === 'week') {
      const wk = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      wk.setDate(wk.getDate() - wk.getDay());
      return localDayKey(wk);
    }
    return localDayKey(d);
  };
  const bucketLabel = (key) => {
    if (bucket === 'month') {
      const [y, m] = key.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString([], { month: 'short' });
    }
    return new Date(key + 'T00:00:00').toLocaleDateString([], bucket === 'week' ? { month: 'short', day: 'numeric' } : { weekday: 'short' });
  };

  // Build ordered bucket list across current + previous period
  const keys = [];
  const cursor = new Date(prevStart);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  while (cursor <= end) {
    keys.push(bucketKey(cursor));
    cursor.setDate(cursor.getDate() + (bucket === 'month' ? 28 : bucket === 'week' ? 7 : 1));
    if (bucket === 'month') {
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + 1);
      cursor.setTime(next.getTime());
    }
    if (keys.length > 400) break;
  }
  const uniqueKeys = [...new Set(keys)];

  const counts = new Map(uniqueKeys.map((k) => [k, { current: 0, previous: 0 }]));
  for (const c of completions) {
    const k = bucketKey(c.at);
    if (!counts.has(k)) continue;
    if (c.at >= start) counts.get(k).current += 1;
    else counts.get(k).previous += 1;
  }

  return uniqueKeys.map((k) => ({
    period: bucketLabel(k),
    key: k,
    current: counts.get(k).current,
    previous: counts.get(k).previous,
  }));
}

// ---------------------------------------------------------------------------
// Recent activity derived from real task timestamps (no fake feed)
// ---------------------------------------------------------------------------
export function selectRecentActivity(tasks = [], limit = 8) {
  const events = [];
  for (const t of tasks) {
    const doneAt = completedAtOf(t);
    if (doneAt) {
      events.push({ id: `${t.id}-done`, taskId: t.id, title: t.title, action: 'completed', at: doneAt });
    }
    const upd = toDate(t.updatedAt);
    if (upd && (!doneAt || upd.getTime() !== doneAt.getTime())) {
      events.push({ id: `${t.id}-upd`, taskId: t.id, title: t.title, action: 'updated', at: upd, status: t.backendStatus });
    }
  }
  return events
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map((e) => ({ ...e, time: e.at.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }));
}

// ---------------------------------------------------------------------------
// AI prioritizer ranking — open tasks only, score + contribution breakdown
// ---------------------------------------------------------------------------
export function rankOpenTasks(tasks = [], weights = { importance: 70, urgency: 80, effort: 35 }) {
  const Wi = Number(weights.importance ?? 70);
  const Wu = Number(weights.urgency ?? 80);
  const We = Number(weights.effort ?? 35);
  const minRaw = Wi * 1 + Wu * 1 - We * 10;
  const maxRaw = Wi * 10 + Wu * 10 - We * 1;
  const range = maxRaw - minRaw || 1;

  return tasks
    .filter(isOpen)
    .map((t) => {
      const importance = Number(t.importance ?? 5);
      const urgency = t.urgency !== undefined && t.urgency !== null
        ? Number(t.urgency)
        : calculateUrgency(t.deadline);
      const effort = Number(t.effort ?? 3);
      const iPart = Wi * importance;
      const uPart = Wu * urgency;
      const ePart = We * effort;
      const raw = iPart + uPart - ePart;
      const score = Math.max(5, Math.min(99, Math.round(((raw - minRaw) / range) * 100)));
      return {
        task: t,
        score,
        contributions: { importance: iPart, urgency: uPart, effort: ePart },
        estimated: t.isEstimated === true,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = toDate(a.task.deadline)?.getTime() ?? Infinity;
      const db = toDate(b.task.deadline)?.getTime() ?? Infinity;
      if (da !== db) return da - db;
      return Number(b.task.importance ?? 0) - Number(a.task.importance ?? 0);
    });
}

// Group employee "my work" tasks into Today / This week / Overdue
export function groupMyTasks(tasks = [], now = new Date()) {
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfToday); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const groups = { overdue: [], today: [], week: [], later: [], done: [] };
  for (const t of tasks) {
    if (isCancelled(t)) continue;
    if (isCompleted(t)) { groups.done.push(t); continue; }
    const d = toDate(t.deadline);
    if (!d) { groups.later.push(t); continue; }
    if (d < startOfToday) groups.overdue.push(t);
    else if (d <= endOfWeek) groups.week.push(t);
    else groups.later.push(t);
  }
  const byDeadline = (a, b) => (toDate(a.deadline)?.getTime() ?? Infinity) - (toDate(b.deadline)?.getTime() ?? Infinity);
  for (const k of Object.keys(groups)) groups[k].sort(byDeadline);
  return groups;
}
