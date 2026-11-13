import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

// /dashboard renders a different layout per role.
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'Admin') return <AdminDashboard />;
  if (user?.role === 'Manager') return <ManagerDashboard />;
  return <EmployeeDashboard />;
};

export default DashboardRouter;
