import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Sparkles, Building2, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import AuroraBackground from '../components/ui/AuroraBackground';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');

  const { login, registerCompany } = useAuth();
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const result = await login(email || 'kiran@flowzen.ai', password || 'flowzen123');
    if (result.success) {
      navigate('/dashboard');
    } else {
      setLoginError(result.error || 'Account not found');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const result = await registerCompany({
      companyName: companyName || 'FlowZen Studio',
      adminName: adminName || 'Admin Leader',
      email: email || 'admin@flowzen.ai',
      password: password || 'flowzen123',
    });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (targetRole, demoEmail) => {
    const result = await login(demoEmail, 'flowzen123', targetRole);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-page)]">
      <AuroraBackground />
      {/* Top Header Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/80 dark:bg-black/30 p-2 shadow-sm border border-accent/30 flex items-center justify-center">
            <img src="/logo.png" alt="FlowZen Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-zen-textDark dark:text-zen-textLight tracking-tight">
            FlowZen Workspace
          </h2>
          <p className="text-xs text-zen-muted mt-1">
            {mode === 'login' ? 'Sign in to access your team dashboard' : 'Register your company and launch as Admin'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-accent/10 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-accent text-white shadow-sm'
                : 'text-zen-muted hover:text-zen-textDark dark:hover:text-zen-textLight'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-accent text-white shadow-sm'
                : 'text-zen-muted hover:text-zen-textDark dark:hover:text-zen-textLight'
            }`}
          >
            Register Company
          </button>
        </div>

        {/* ===================== SIGN IN FORM ===================== */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
                <p className="font-semibold">{loginError}</p>
                <button type="button" onClick={() => setMode('register')} className="mt-1 underline">
                  Register your company
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type="email"
                  required
                  placeholder="e.g. kiran@flowzen.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zen-muted hover:text-zen-textDark"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In to FlowZen</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* ===================== REGISTER COMPANY FORM ===================== */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. FlowZen Technologies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Admin Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kiran Deshmukh"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type="email"
                  required
                  placeholder="admin@flowzen.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zen-muted uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-muted" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-accent/30 bg-white/60 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-accent dark:text-accent flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-accent" />
              <span>Company creator will receive full <strong>Admin</strong> privileges & management controls.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Register Company & Enter</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {import.meta.env.DEV && (
          <>
            {/* Quick Demo Login Pills (Instant 1-Click Access) */}
            <div className="mt-6 pt-5 border-t border-accent/15">
              <p className="text-[11px] text-zen-muted text-center uppercase tracking-wider font-semibold mb-2.5">
                ⚡ Quick Demo 1-Click Sign In
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Admin', 'kiran@flowzen.ai')}
                  className="py-1.5 px-2 rounded-lg bg-accent/15 hover:bg-accent hover:text-white text-accent dark:text-accent text-[11px] font-bold transition-all text-center"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Manager', 'gayatri@flowzen.ai')}
                  className="py-1.5 px-2 rounded-lg bg-accent/15 hover:bg-accent hover:text-white text-accent dark:text-accent text-[11px] font-bold transition-all text-center"
                >
                  🎯 Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Employee', 'mansi@flowzen.ai')}
                  className="py-1.5 px-2 rounded-lg bg-accent/15 hover:bg-accent hover:text-white text-accent dark:text-accent text-[11px] font-bold transition-all text-center"
                >
                  🌱 Employee
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthPage;
