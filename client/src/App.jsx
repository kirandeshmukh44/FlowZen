import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { SoundProvider } from './hooks/useSound';

import AppShell from './layouts/AppShell';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardOverview from './pages/DashboardOverview';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import AIPrioritizerPage from './pages/AIPrioritizerPage';
import RewardsPage from './pages/RewardsPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import Preloader from './components/Preloader';

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
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  <Route path="/tasks" element={<KanbanPage />} />
                  <Route path="/kanban" element={<KanbanPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/prioritizer" element={<AIPrioritizerPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/gamification" element={<RewardsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
