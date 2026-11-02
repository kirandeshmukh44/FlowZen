import React, { createContext, useContext, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { initialTasks, initialTeamMembers, projectStreams, initialGamification, initialNotifications } from '../mock/mockData';
import { computeAIScore } from '../utils/aiScore';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('flowzen_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return initialTasks; }
    }
    return initialTasks;
  });

  const [teamMembers, setTeamMembers] = useState(() => {
    const saved = localStorage.getItem('flowzen_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return initialTeamMembers; }
    }
    return initialTeamMembers;
  });

  const [activeStream, setActiveStream] = useState(projectStreams[0].id);

  // AI Priority Weights (0-100 each, matching the mockup where Wi=100, Wu=100, We=100)
  const [weights, setWeights] = useState({ importance: 70, urgency: 80, effort: 35 });

  const [gamification, setGamification] = useState(() => {
    const member = initialTeamMembers.find((m) => m.email === user?.email) || initialTeamMembers.find((m) => m.id === 'user-4');
    return {
      ...initialGamification,
      xp: member?.xp ?? initialGamification.xp,
      userLevel: member?.level ?? initialGamification.userLevel,
    };
  });
  const [notifications, setNotifications] = useState(initialNotifications);

  // Update weights
  const updateWeight = (key, val) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  // Compute tasks with dynamic AI score
  const scoredTasks = useMemo(() => {
    return tasks.map((task) => {
      const aiScore = computeAIScore(task, weights);
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

  // Mark task complete
  const markComplete = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;
          if (isNowCompleted) {
            triggerCelebration();
            toast.success(`🎉 "${t.title}" accomplished! +50 XP`, {
              style: {
                borderRadius: '16px',
                background: '#FBEFF0',
                color: '#3A2A2D',
                border: '1px solid #C98A8F',
              },
            });
            // Boost Gamification XP
            setGamification((g) => ({
              ...g,
              xp: g.xp + 50,
              taskStreak: g.taskStreak + 1,
            }));
          }
          return {
            ...t,
            completed: isNowCompleted,
            progress: isNowCompleted ? 100 : 50,
            column: isNowCompleted ? 'done' : 'in_progress',
            status: isNowCompleted ? 'Done' : 'In Progress',
          };
        }
        return t;
      })
    );
  };

  // Move column in Kanban
  const moveTaskColumn = (taskId, newColumn) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = newColumn === 'done';
          if (isDone && !t.completed) {
            triggerCelebration();
            toast.success(`Task moved to Done! +50 XP`);
          }
          return {
            ...t,
            column: newColumn,
            completed: isDone,
            progress: isDone ? 100 : t.progress,
            status: newColumn === 'backlog' ? 'Backlog' :
                    newColumn === 'in_progress' ? 'In Progress' :
                    newColumn === 'review' ? 'Review' :
                    newColumn === 'done' ? 'Done' : 'Archived',
          };
        }
        return t;
      })
    );
  };

  // Add task
  const addTask = (newTaskData) => {
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
  };

  // Add team member
  const addTeamMember = (memberData) => {
    const newMember = {
      id: `user-${Date.now()}`,
      name: memberData.name,
      email: memberData.email,
      role: memberData.role || 'Employee',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=120&auto=format&fit=crop&q=80`,
      online: true,
      capacity: 50,
      tasksCount: 0,
      completedCount: 0,
      xp: 500,
      level: 'Beginner',
    };
    setTeamMembers((prev) => [...prev, newMember]);
    toast.success(`Invited ${newMember.name} to the team!`);
  };

  // Notification helpers
  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: scoredTasks,
        allTasks: tasks,
        teamMembers,
        projectStreams,
        activeStream,
        setActiveStream,
        weights,
        updateWeight,
        markComplete,
        moveTaskColumn,
        addTask,
        addTeamMember,
        gamification,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
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

