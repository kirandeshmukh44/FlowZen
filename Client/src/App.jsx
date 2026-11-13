import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { SoundProvider } from './hooks/useSound';

import AppShell from './layouts/AppShell';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import AIPrioritizerPage from './pages/AIPrioritizerPage';
import RewardsPage from './pages/RewardsPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import Preloader from './components/Preloader';

// Redirects to /auth when there is no session (live mode).
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

// Redirects to /dashboard when the user's role is not allowed.
const RequireRole = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export function App() {
  return (
    <AppearanceProvider>
      <Preloader />
      <SoundProvider>
        <AuthProvider>
          <TaskProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing & Auth */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Authenticated Workspace Shell */}
                <Route element={<RequireAuth><AppShell /></RequireAuth>}>
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  <Route path="/tasks" element={<KanbanPage />} />
                  <Route path="/kanban" element={<KanbanPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/team" element={<RequireRole roles={['Admin', 'Manager']}><TeamPage /></RequireRole>} />
                  <Route path="/prioritizer" element={<AIPrioritizerPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/gamification" element={<RewardsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>

            {/* Custom Modern Toast Notifications */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  color: 'var(--text-main)',
                  boxShadow: '0 10px 25px -3px rgba(16, 24, 40, 0.1)',
                  fontWeight: 600,
                  fontSize: '13px',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--accent)',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
          </TaskProvider>
        </AuthProvider>
      </SoundProvider>
    </AppearanceProvider>
  );
}

export default App;
