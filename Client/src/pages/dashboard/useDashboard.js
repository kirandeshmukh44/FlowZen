import { useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import {
  scopeTasksForRole,
  selectTaskCounts,
  selectCompletedPerDay,
  selectStatusBreakdown,
  selectOverdue,
  selectDueSoon,
  selectAwaitingApproval,
  selectRecentActivity,
  workloadForAll,
  groupMyTasks,
} from '../../lib/metrics';

// Shared data hook: role-scoped task slice + derived metrics.
export const useDashboardData = () => {
  const { tasks, teamMembers, gamification } = useTasks();
  const { user } = useAuth();

  return useMemo(() => {
    const scoped = scopeTasksForRole(tasks, { user, teamMembers });
    return {
      user,
      teamMembers,
      gamification,
      scopedTasks: scoped,
      counts: selectTaskCounts(scoped),
      completedPerDay: selectCompletedPerDay(scoped, 7),
      statusBreakdown: selectStatusBreakdown(scoped),
      overdue: selectOverdue(scoped),
      dueSoon: selectDueSoon(scoped, 3),
      awaitingApproval: selectAwaitingApproval(scoped),
      recentActivity: selectRecentActivity(scoped, 8),
      workload: workloadForAll(scoped, teamMembers),
      myGroups: groupMyTasks(scoped),
    };
  }, [tasks, teamMembers, gamification, user]);
};
