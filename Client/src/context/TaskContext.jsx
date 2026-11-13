import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import apiClient, { USE_MOCK } from '../api/client';
import { normalizeTask, normalizeTeamMember, COLUMN_TO_STATUS } from '../api/adapters';
import { computeAIScore } from '../utils/aiScore';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

// Map the modal's client-side sliders onto the backend priority enum.
// Backend Task.priority: Low | Medium | High | Critical (required on create).
const priorityFromScalars = ({ importance = 5, urgency = 5 }) => {
  const i = Number(importance);
  const u = Number(urgency);
  if (i >= 10 && u >= 8) return 'Critical';
  if (i >= 7 || u >= 8) return 'High';
  if (i <= 3 && u <= 4) return 'Low';
  return 'Medium';
};

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const mockMode = USE_MOCK;

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);

  // AI Priority Weights (0-100 each). Persisted per user in localStorage so
  // "Apply to Sprints" on the prioritizer page has a real effect.
  const [weights, setWeights] = useState({ importance: 70, urgency: 80, effort: 35 });

  // Load persisted weights when the user changes
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`flowzen_weights_${user.id}`));
      if (saved && typeof saved === 'object') {
        setWeights({
          importance: Number(saved.importance ?? 70),
          urgency: Number(saved.urgency ?? 80),
          effort: Number(saved.effort ?? 35),
        });
      }
    } catch (e) { /* ignore corrupt value */ }
  }, [user?.id]);

  const [gamification, setGamification] = useState({
    xp: 0,
    userLevel: 1,
    taskStreak: 0,
    completedCount: 0,
    dailyCompleted: 0,
    dailyGoal: 5,
    badges: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [teamMembersError, setTeamMembersError] = useState(null);

  // ------------------------------------------------------------------
  // Data loading (live mode only)
  // ------------------------------------------------------------------

  // Build a lookup of team members by id for resolving assignment payloads.
  // GET /users is Admin/Manager-only — Employees get a self-only member
  // locally (their tasks are self-assigned anyway, no API call needed).
  const fetchTeamMembers = useCallback(async () => {
    if (user?.role === 'Employee') {
      const self = user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        online: true,
        capacity: 100,
        tasksCount: 0,
        completedCount: 0,
        xp: 0,
        level: 'Member'
      } : null;
      setTeamMembers(self ? [self] : []);
      return self ? [self] : [];
    }
    try {
      const res = await apiClient.get('/users');
      const users = res.data?.users || res.data?.data || [];
      const members = users.map(normalizeTeamMember).filter(Boolean);
      setTeamMembers(members);
      setTeamMembersError(null);
      return members;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load team members';
      console.warn('GET /users failed:', err?.response?.status || err.message);
      setTeamMembers([]);
      setTeamMembersError(message);
      toast.error(`Team members could not be loaded: ${message}`);
      return [];
    }
  }, [user]);

  const fetchRewards = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get('/rewards/me');
      if (res.data?.success && res.data?.rewards) {
        const r = res.data.rewards;
        const badges = r.badges || [];
        const latestBadge = badges.length ? badges[badges.length - 1]?.name : '';
        setGamification({
          xp: r.xp || 0,
          userLevel: r.level || 1,
          levelName: r.levelName || '',
          nextLevelName: r.nextLevelName || null,
          nextLevelXp: r.nextLevelAt ? r.nextLevelAt - (r.xp || 0) : 500,
          progressToNext: r.progressToNext ?? null,
          taskStreak: r.taskStreak || 0,
          completedCount: r.completedTasks || 0,
          dailyCompleted: r.completedTasks || 0,
          dailyGoal: 5,
          badges,
          latestBadge,
        });
      }
    } catch (err) {
      console.warn('GET /rewards/me failed:', err?.response?.status || err.message);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get(`/notifications/user/${user.id}`);
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const notifs = res.data.notifications.map((n) => ({
          id: n._id || n.notificationId,
          title: n.notificationType || 'Notification',
          message: n.message,
          time: new Date(n.createdAt || n.createdOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: !!n.isRead,
          type: (n.notificationType || '').toLowerCase().includes('task') ? 'task' : 'general',
        }));
        setNotifications(notifs);
      }
    } catch (err) {
      console.warn('GET /notifications failed:', err?.response?.status || err.message);
    }
  }, [user?.id]);

  const fetchTasks = useCallback(async () => {
    if (mockMode) return;
    setTasksLoading(true);
    setTasksError(null);
    try {
      const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

      // Members list (also used to resolve assignee ids -> display objects)
      let members = teamMembers;
      if (isManagerOrAdmin || members.length === 0) {
        members = await fetchTeamMembers();
      }
      const memberById = new Map(members.map((m) => [String(m.id), m]));

      const tasksRes = await apiClient.get('/tasks');
      const rawTasks = tasksRes.data?.tasks || [];

      // TaskAssignment is a separate collection; tasks come back unpopulated.
      // Admin/Manager: GET /task-assignments returns all (populated).
      // Employee: GET /tasks is already filtered server-side; assignments
      // endpoint is Admin/Manager only, so the employee is their own assignee.
      const assigneesByTask = new Map();
      if (isManagerOrAdmin) {
        try {
          const asgRes = await apiClient.get('/task-assignments');
          const assignments = asgResResSafe(asgRes);
          for (const a of assignments) {
            const taskKey = String(a.taskId?._id || a.taskId?.id || a.taskId);
            const member = a.employeeId && typeof a.employeeId === 'object'
              ? normalizeTeamMember(a.employeeId)
              : memberById.get(String(a.employeeId?._id || a.employeeId)) || null;
            if (!member) continue;
            if (!assigneesByTask.has(taskKey)) assigneesByTask.set(taskKey, []);
            assigneesByTask.get(taskKey).push(member);
          }
        } catch (err) {
          console.warn('GET /task-assignments failed:', err?.response?.status || err.message);
        }
      } else if (user) {
        const self = memberById.get(String(user.id)) || {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        };
        for (const t of rawTasks) {
          assigneesByTask.set(String(t._id || t.id), [self]);
        }
      }

      const normalized = rawTasks
        .map((t) => normalizeTask(t, assigneesByTask.get(String(t._id || t.id)) || []))
        .filter(Boolean);
      setTasks(normalized);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load tasks';
      setTasksError(message);
      toast.error(message);
    } finally {
      setTasksLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode, user?.id, user?.role]);

  // small helper kept separate for readability
  function asgResResSafe(res) {
    return res.data?.assignments || res.data?.data || [];
  }

  // Load once a user session exists (token restored from localStorage).
  const loadedForUser = useRef(null);
  useEffect(() => {
    if (mockMode || !user?.id) return;
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    fetchTasks();
    fetchRewards();
    fetchNotifications();
  }, [mockMode, user?.id, fetchTasks, fetchRewards, fetchNotifications]);

  // Poll every 20s so task/notification/reward changes from other users
  // (chat messages, approvals, assignments) appear without a manual refresh.
  useEffect(() => {
    if (mockMode || !user?.id) return undefined;
    const id = setInterval(() => {
      fetchNotifications();
      fetchTasks();
      fetchRewards();
    }, 20000);
    return () => clearInterval(id);
  }, [mockMode, user?.id, fetchNotifications, fetchTasks, fetchRewards]);

  // Persist mock tasks locally in demo mode only
  useEffect(() => {
    if (!mockMode) return;
    localStorage.setItem('flowzen_tasks', JSON.stringify(tasks));
    localStorage.setItem('flowzen_members', JSON.stringify(teamMembers));
  }, [mockMode, tasks, teamMembers]);

  // Update weights (persisted per user when a session exists)
  const updateWeight = (key, val) => {
    setWeights((prev) => {
      const next = { ...prev, [key]: Number(val) };
      if (user?.id) {
        try { localStorage.setItem(`flowzen_weights_${user.id}`, JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
  };

  // Compute tasks with dynamic AI score
  const scoredTasks = useMemo(() => {
    return tasks.map((task) => {
      const aiScore = task.aiScore ?? computeAIScore(task, weights);
      return {
        ...task,
        aiScore,
      };
    }).sort((a, b) => {
      if (b.aiScore !== a.aiScore) return b.aiScore - a.aiScore;
      const da = new Date(a.deadline).getTime();
      const db = new Date(b.deadline).getTime();
      if (da !== db) return da - db;
      return (b.importance || 0) - (a.importance || 0);
    });
  }, [tasks, weights]);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C98A8F', '#F6E7A8', '#F2D4D7', '#FFFFFF', '#A3585F'],
      });
    } catch (e) {
      // Confetti fallback
    }
  };

  // ------------------------------------------------------------------
  // Status updates — single code path for Kanban drag + dashboard check
  // ------------------------------------------------------------------

  // backendStatus must be one of: Pending | In Progress | Completed | On Hold | Cancelled
  const persistStatus = async (taskId, backendStatus, { optimisticPatch } = {}) => {
    const isEmployee = user?.role === 'Employee';
    const prevTasks = tasks;

    // Optimistic update
    if (optimisticPatch) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...optimisticPatch } : t)));
    }

    try {
      let res;
      if (mockMode) {
        return; // local-only mutation already applied by caller
      } else if (isEmployee) {
        // Employees may only update tasks assigned to them — enforced
        // server-side by PATCH /api/task-updates.
        res = await apiClient.patch('/task-updates', {
          taskId,
          newStatus: backendStatus,
        });
      } else {
        res = await apiClient.put(`/tasks/${taskId}`, { status: backendStatus });
      }
      // Apply the authoritative task returned by the backend
      const serverTask = res.data?.task;
      if (serverTask) {
        setTasks((prev) => prev.map((t) => {
          if (t.id !== taskId) return t;
          const normalized = normalizeTask(serverTask, t.assignees || []);
          return normalized ? { ...normalized, aiScore: t.aiScore } : t;
        }));
      }
      return true;
    } catch (err) {
      // Rollback
      setTasks(prevTasks);
      const message = err?.response?.data?.message || 'Failed to update task status';
      toast.error(message);
      return false;
    }
  };

  // Mark task complete (dashboard checkbox / card button). Toggles.
  const markComplete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const isNowCompleted = !task.completed;
    const backendStatus = isNowCompleted ? 'Completed' : 'In Progress';
    const patch = {
      completed: isNowCompleted,
      progress: isNowCompleted ? 100 : 50,
      column: isNowCompleted ? 'done' : 'in_progress',
      status: isNowCompleted ? 'Done' : 'In Progress',
      backendStatus,
    };

    if (mockMode) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    } else {
      const ok = await persistStatus(taskId, backendStatus, { optimisticPatch: patch });
      if (!ok) return;
    }

    if (isNowCompleted) {
      triggerCelebration();
      toast.success(`🎉 "${task.title}" accomplished! +50 XP`, {
        style: {
          borderRadius: '16px',
          background: '#FBEFF0',
          color: '#3A2A2D',
          border: '1px solid #C98A8F',
        },
      });
      setGamification((g) => ({
        ...g,
        xp: g.xp + 50,
        taskStreak: g.taskStreak + 1,
      }));
    }
  };

  // Review workflow — Admin/Manager only.
  // approveTask: POST /tasks/:id/approve (idempotent XP award server-side)
  // sendBackTask: POST /tasks/:id/send-back {note}
  const approveTask = async (taskId) => {
    if (mockMode) { await fetchTasks(); return true; }
    try {
      const res = await apiClient.post(`/tasks/${taskId}/approve`);
      toast.success(res.data?.message || 'Task approved');
      await fetchTasks();
      fetchRewards?.();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
      return false;
    }
  };

  const sendBackTask = async (taskId, note = '') => {
    if (mockMode) { await fetchTasks(); return true; }
    try {
      const res = await apiClient.post(`/tasks/${taskId}/send-back`, { note });
      toast.success(res.data?.message || 'Task sent back');
      await fetchTasks();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send back failed');
      return false;
    }
  };

  // Move column in Kanban (drag & drop or select)
  const moveTaskColumn = async (taskId, newColumn) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.column === newColumn) return;
    const backendStatus = COLUMN_TO_STATUS[newColumn];
    if (!backendStatus) {
      toast.error(`Column "${newColumn}" is not supported by the backend`);
      return;
    }
    const isDone = newColumn === 'done';
    const patch = {
      column: newColumn,
      completed: isDone,
      progress: isDone ? 100 : task.progress,
      status: newColumn === 'backlog' ? 'Backlog' :
              newColumn === 'in_progress' ? 'In Progress' :
              newColumn === 'review' ? 'Review' : 'Done',
      backendStatus,
    };

    if (mockMode) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    } else {
      const ok = await persistStatus(taskId, backendStatus, { optimisticPatch: patch });
      if (!ok) return;
    }

    if (isDone && !task.completed) {
      triggerCelebration();
      toast.success(`Task moved to Done! +50 XP`);
      setGamification((g) => ({ ...g, xp: g.xp + 50, taskStreak: g.taskStreak + 1 }));
    }
  };

  // Add task — Admin/Manager only (UI already hides the button for Employee).
  // POST /tasks then POST /task-assignments per selected assignee.
  const addTask = async (newTaskData) => {
    const selectedAssignees = (newTaskData.assignees && newTaskData.assignees.length
      ? newTaskData.assignees
      : [newTaskData.assignee].filter(Boolean));

    if (mockMode) {
      const newTask = {
        id: `task-${Date.now()}`,
        title: newTaskData.title,
        description: newTaskData.description || 'No description provided.',
        status: 'Backlog',
        column: 'backlog',
        importance: Number(newTaskData.importance || 7),
        urgency: Number(newTaskData.urgency || 6),
        effort: Number(newTaskData.effort || 3),
        deadline: newTaskData.deadline || '2026-11-10',
        progress: 0,
        assignee: newTaskData.assignee || teamMembers[0],
        assignees: newTaskData.assignees || [newTaskData.assignee || teamMembers[0]],
        tags: newTaskData.tags || [],
        tagColor: newTaskData.tagColor || 'rose',
        completed: false,
      };
      setTasks((prev) => [newTask, ...prev]);
      toast.success('New task created and prioritized by AI!');
      return { success: true, task: newTask };
    }

    try {
      const priority = priorityFromScalars(newTaskData);
      const deadline = newTaskData.deadline || '';
      const res = await apiClient.post('/tasks', {
        title: newTaskData.title,
        // Backend requires a non-empty description (400 otherwise).
        description: newTaskData.description?.trim() || 'No description provided.',
        priority,
        deadline,
        importance: Number(newTaskData.importance) || undefined,
        urgency: Number(newTaskData.urgency) || undefined,
        effort: Number(newTaskData.effort) || undefined,
        category: newTaskData.category || undefined,
        tags: Array.isArray(newTaskData.tags) ? newTaskData.tags : undefined,
      });
      const created = res.data?.task;
      const taskId = created?._id || created?.id;
      if (!taskId) throw new Error('Task created but no id returned');

      // Assign to each selected employee. Backend POST /task-assignments
      // rejects non-Employee assignees (404 "Valid employee not found"),
      // so Admin/Manager selections are skipped.
      const failures = [];
      let skipped = 0;
      for (const member of selectedAssignees) {
        const employeeId = member?.id || member?._id;
        if (!employeeId) continue;
        if (member?.role && member.role !== 'Employee') { skipped++; continue; }
        try {
          await apiClient.post('/task-assignments', { taskId, employeeId });
        } catch (err) {
          failures.push(member?.name || employeeId);
          console.warn('Assignment failed for', member?.name, err?.response?.data?.message || err.message);
        }
      }
      if (skipped > 0) {
        toast('Skipped non-employee assignees (backend only assigns to Employees)', { icon: 'ℹ️' });
      }

      toast.success(
        failures.length
          ? `Task created, but assignment failed for: ${failures.join(', ')}`
          : 'New task created and prioritized by AI!'
      );
      await fetchTasks();
      return { success: true, task: created };
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create task';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Delete task from MongoDB
  const deleteTask = async (taskId) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task removed');
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete task';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Add team member — calls backend POST /users
  // Automatically creates user in MongoDB and returns generated tempPassword
  const addTeamMember = async (memberData) => {
    try {
      const res = await apiClient.post('/users', {
        name: memberData.name.trim(),
        email: memberData.email.trim().toLowerCase(),
        role: memberData.role || 'Employee',
      });
      if (res.data?.success) {
        const createdUser = res.data.user;
        const tempPassword = res.data.tempPassword;
        const normalized = normalizeTeamMember(createdUser);
        if (normalized) {
          setTeamMembers((prev) => [...prev, normalized]);
        }
        if (tempPassword) {
          toast.success(
            `User created! Temporary Password: ${tempPassword}`,
            { duration: 8000 }
          );
        } else {
          toast.success(`User ${memberData.name} created!`);
        }
        return { success: true, user: createdUser, tempPassword };
      }
      return { success: false, error: res.data?.message };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create user on server';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Remove team member — calls backend DELETE /users/:id
  const removeTeamMember = async (userId) => {
    try {
      await apiClient.delete(`/users/${userId}`);
      setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
      toast.success('Team member removed');
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to remove user';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Notification helpers — connected to backend PATCH /notifications/:id/read
  // Local state only updates when the server confirms the write.
  const markNotificationRead = async (notifId) => {
    try {
      await apiClient.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to mark notification as read';
      toast.error(message);
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((x) => !x.read);
    if (unread.length === 0) return;
    const results = await Promise.allSettled(
      unread.map((n) => apiClient.patch(`/notifications/${n.id}/read`))
    );
    const succeeded = new Set();
    const failures = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') succeeded.add(unread[i].id);
      else failures.push(r.reason?.response?.data?.message || 'Request failed');
    });
    if (succeeded.size) {
      setNotifications((prev) => prev.map((n) => (succeeded.has(n.id) ? { ...n, read: true } : n)));
    }
    if (failures.length === 0) {
      toast.success('All notifications marked as read');
    } else {
      toast.error(`Failed to mark ${failures.length} notification(s) as read: ${failures[0]}`);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: scoredTasks,
        allTasks: tasks,
        teamMembers,
        weights,
        updateWeight,
        markComplete,
        moveTaskColumn,
        approveTask,
        sendBackTask,
        addTask,
        deleteTask,
        addTeamMember,
        removeTeamMember,
        gamification,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        tasksLoading,
        tasksError,
        teamMembersError,
        refreshTasks: fetchTasks,
        refreshRewards: fetchRewards,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};
