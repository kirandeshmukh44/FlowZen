import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Users, 
  Sliders, 
  Trophy, 
  MessageSquare, 
  Settings as SettingsIcon,
  Search, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Flame, 
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  User,
  Zap,
  CheckCircle2,
  Plus,
  Camera
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import ProfilePhotoUpload from '../components/ui/ProfilePhotoUpload';
import { useAuth } from '../context/AuthContext';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import { useTasks } from '../context/TaskContext';
import CommandPalette from '../components/CommandPalette';
import AddTaskModal from '../components/ui/AddTaskModal';
import BrandLogo from '../components/ui/BrandLogo';
import AuroraBackground from '../components/ui/AuroraBackground';
import Portal from '../components/ui/Portal';
import { usePopoverPosition } from '../hooks/usePopoverPosition';

export const AppShell = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark, accentPreset } = useAppearance();
  const { isMuted, toggleMute, playClick, playToggle, playDrawer } = useSound();
  const { gamification, notifications, markAllNotificationsRead } = useTasks();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfilePhotoOpen, setIsProfilePhotoOpen] = useState(false);

  // Single active popover state: 'notif' | 'profile' | null
  const [activePopover, setActivePopover] = useState(null);

  const sidebarNavRef = useRef(null);
  const notifBtnRef = useRef(null);
  const profileBtnRef = useRef(null);
  const popoverContentRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const mainScrollRef = useRef(null);

  // Reset the main scroll container to top on every route change
  // (the <main> element is the real scroll viewport, not window).
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Close popover on route change
  useEffect(() => {
    setActivePopover(null);
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Users on a temporary password must set a new one before using the app.
  useEffect(() => {
    if (user?.mustChangePassword && location.pathname !== '/account') {
      navigate('/account?required=1', { replace: true });
    }
  }, [user?.mustChangePassword, location.pathname, navigate]);

  // Scroll active sidebar item into view on route change
  useEffect(() => {
    const el = sidebarNavRef.current?.querySelector('[aria-current="page"]');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [location.pathname]);

  // Global outside click & Escape key listeners for popovers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playClick();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    const handlePointerDown = (e) => {
      if (!activePopover) return;

      const isInsideNotifBtn = notifBtnRef.current && notifBtnRef.current.contains(e.target);
      const isInsideProfileBtn = profileBtnRef.current && profileBtnRef.current.contains(e.target);
      const isInsidePopover = popoverContentRef.current && popoverContentRef.current.contains(e.target);

      if (!isInsideNotifBtn && !isInsideProfileBtn && !isInsidePopover) {
        setActivePopover(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activePopover, playClick]);

  const { popoverStyle: notifPosition } = usePopoverPosition(notifBtnRef, activePopover === 'notif');
  const { popoverStyle: profilePosition } = usePopoverPosition(profileBtnRef, activePopover === 'profile');

  // `roles` limits a nav entry; omitted = visible to every role.
  // Mirrors backend authorization (e.g. /team data is Admin/Manager-only).
  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: Kanban },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Team', path: '/team', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'AI Prioritizer', path: '/prioritizer', icon: Sliders },
    { name: 'Rewards', path: '/rewards', icon: Trophy },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];
  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(user?.role));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-[100dvh] w-screen overflow-hidden p-0 sm:p-2 md:p-3 bg-[var(--bg-page)] relative flex flex-col text-[var(--text-main)] transition-colors duration-250 select-none">
      
      {/* Aurora Ambient Background (Phase 2 drifting blobs) */}
      <AuroraBackground />

      {/* Floating Inset Glass App Shell Container */}
      <div className="relative w-full h-full flex rounded-none sm:rounded-[24px] overflow-hidden border-0 sm:border border-[var(--surface-nav-border)] bg-[rgba(253,243,246,0.65)] dark:bg-[rgba(13,9,19,0.72)] backdrop-blur-2xl shadow-2xl">
        
        {/* ===================== DESKTOP / TABLET SIDEBAR ===================== */}
        <aside className="hidden md:flex flex-col md:w-16 lg:w-64 h-full surface-nav border-r border-[var(--surface-nav-border)] shrink-0 select-none z-30 transition-all duration-200">
          
          {/* Brand Header */}
          <div className="h-14 sm:h-16 flex items-center justify-center lg:justify-between md:px-2 lg:px-6 border-b border-[var(--border-subtle)] shrink-0">
            <div 
              onClick={() => {
                playClick();
                navigate('/dashboard');
              }} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="hidden lg:block">
                <BrandLogo size="md" showText={true} />
              </div>
              <div className="lg:hidden">
                <BrandLogo size="xs" showText={false} />
              </div>
            </div>
          </div>

          {/* Navigation Items (Self-Scrolling) */}
          <nav ref={sidebarNavRef} className="flex-1 px-2 lg:px-3 py-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/kanban');

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => playClick()}
                  title={item.name}
                  className={`relative flex items-center justify-center lg:justify-start gap-3 md:px-2.5 lg:px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
                  }`}
                >
                  {/* Sliding Active Pill with Framer Motion layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 rounded-xl bg-accent shadow-sm"
                    />
                  )}

                  <span className="relative z-10 shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="relative z-10 flex-1 hidden lg:inline">{item.name}</span>

                  {item.name === 'Chat' && (
                    <span className="relative z-10 w-2 h-2 rounded-full bg-emerald-400 hidden lg:inline-block" />
                  )}
                  {item.name === 'Tasks' && (
                    <span className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full hidden lg:inline-block ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      Kanban
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Pinned Card: Focus Streak & Milestones */}
          <div className="p-2 lg:p-3.5 border-t border-[var(--border-subtle)] shrink-0 [@media(max-height:720px)]:hidden">
            {/* Tablet compact badge */}
            <div 
              onClick={() => {
                playClick();
                navigate('/rewards');
              }}
              className="lg:hidden p-2 rounded-xl surface-card border border-[var(--border-subtle)] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent transition-colors"
              title={`${gamification.taskStreak} Day Streak - View Rewards`}
            >
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold text-[var(--text-main)]">{gamification.taskStreak}d</span>
            </div>

            {/* Desktop expanded card */}
            <div className="hidden lg:block p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] relative overflow-hidden group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                  <Flame size={16} className="text-amber-500 fill-amber-500" />
                  <span>{gamification.taskStreak} Day Streak</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white">
                  {gamification.userLevel}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight mb-2.5">
                {gamification.xp} XP collected. High velocity flow!
              </p>
              <button
                onClick={() => {
                  playClick();
                  navigate('/rewards');
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-[var(--accent-soft)] hover:bg-accent hover:text-white text-accent text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>View Rewards</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* ===================== MOBILE DRAWER ===================== */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  playDrawer(false);
                  setIsMobileSidebarOpen(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />

              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-72 max-w-[85vw] h-full surface-modal border-r border-[var(--surface-modal-border)] flex flex-col justify-between p-4 z-10 shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
                    <BrandLogo size="sm" showText={true} />
                    <button
                      onClick={() => {
                        playDrawer(false);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/kanban');

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            playClick();
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                            isActive
                              ? 'bg-accent text-white font-bold shadow-sm'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
                          }`}
                        >
                          <Icon size={17} />
                          <span>{item.name}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsProfilePhotoOpen(true)}>
                    <Avatar name={user?.name} src={user?.avatar} size={32} />
                    <div>
                      <span className="font-bold block truncate max-w-[120px]">{user?.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{user?.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ===================== MAIN APPLICATION AREA ===================== */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          
          {/* ===================== STICKY TOP BAR ===================== */}
          <header className="h-14 sm:h-16 px-3 sm:px-6 surface-nav border-b border-[var(--surface-nav-border)] flex items-center justify-between gap-2 sm:gap-4 shrink-0 sticky top-0 z-[var(--z-sticky-nav)]">
            
            {/* Left: Mobile hamburger + Mobile logo + Global search */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => {
                  playDrawer(true);
                  setIsMobileSidebarOpen(true);
                }}
                className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                aria-label="Open sidebar"
              >
                <Menu size={19} />
              </button>

              <div 
                onClick={() => {
                  playClick();
                  navigate('/dashboard');
                }} 
                className="md:hidden flex items-center cursor-pointer shrink-0"
              >
                <BrandLogo size="xs" showText={false} />
              </div>

              {/* Desktop/tablet search input trigger */}
              <button
                onClick={() => {
                  playClick();
                  setIsCommandPaletteOpen(true);
                }}
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] surface-card text-xs text-[var(--text-muted)] hover:border-slate-300 dark:hover:border-slate-700 hover:text-[var(--text-main)] transition-all shadow-xs w-44 md:w-56 lg:w-64"
              >
                <Search size={15} />
                <span className="flex-1 text-left truncate">Search or jump to...</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 surface-popover rounded border border-[var(--border-subtle)]">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile quick search icon button */}
              <button
                onClick={() => {
                  playClick();
                  setIsCommandPaletteOpen(true);
                }}
                className="sm:hidden p-2 rounded-xl border border-[var(--border-subtle)] surface-card text-[var(--text-muted)] hover:text-[var(--text-main)]"
                aria-label="Search"
                title="Search (⌘K)"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Right utility items: Single New Task, Sound, Theme, Notifications, User */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Primary Action: ONE New Task Button (Hidden for Employee role) */}
              {user?.role !== 'Employee' && (
                <button
                  onClick={() => {
                    playClick();
                    setIsAddTaskModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                >
                  <Plus size={14} />
                  <span>New Task</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => toggleMute()}
                className="p-1.5 sm:p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative"
                title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                aria-label="Toggle UI Sound"
              >
                {isMuted ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-emerald-500" />}
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={() => {
                  playToggle(!isDark);
                  toggleTheme();
                }}
                className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
              </button>

              {/* Chat Button */}
              <button
                onClick={() => {
                  playClick();
                  navigate('/chat');
                }}
                className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative"
                title="Chat"
                aria-label="Chat"
              >
                <MessageSquare size={16} />
              </button>

              {/* Notifications Trigger Button */}
              <div className="relative">
                <button
                  ref={notifBtnRef}
                  onClick={() => {
                    playClick();
                    setActivePopover(activePopover === 'notif' ? null : 'notif');
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border border-[var(--border-subtle)] transition-colors relative ${
                    activePopover === 'notif' 
                      ? 'bg-accent text-white' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-[var(--surface-nav)]" />
                  )}
                </button>
              </div>

              {/* User Profile Trigger Button */}
              <div className="relative">
                <button
                  ref={profileBtnRef}
                  onClick={() => {
                    playClick();
                    setActivePopover(activePopover === 'profile' ? null : 'profile');
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setIsProfilePhotoOpen(true);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${
                    activePopover === 'profile'
                      ? 'bg-accent/15 ring-2 ring-accent'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-label="User menu"
                  title="Click for menu, right-click to change photo"
                >
                  <Avatar name={user?.name} src={user?.avatar} size={32} className="ring-1 ring-[var(--surface-nav-border)]" />
                  <div className="hidden md:block text-left pr-1">
                    <span className="text-xs font-bold text-[var(--text-main)] block leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-accent font-semibold block leading-tight">
                      {user?.role}
                    </span>
                  </div>
                </button>
              </div>

            </div>
          </header>

          {/* ===================== ISOLATED MAIN CONTENT SCROLL VIEWPORT ===================== */}
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 scroll-smooth" style={{ scrollPaddingTop: '5rem' }}>
            <div className="max-w-7xl mx-auto w-full pb-24 md:pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

      </div>

      {/* ===================== PORTALED NOTIFICATIONS DROPDOWN ===================== */}
      <AnimatePresence>
        {activePopover === 'notif' && (
          <Portal>
            <motion.div
              ref={popoverContentRef}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={notifPosition}
              className="w-80 surface-popover rounded-2xl p-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs font-bold text-[var(--text-main)]">Notifications</span>
                <button
                  onClick={() => {
                    playClick();
                    markAllNotificationsRead();
                  }}
                  className="text-[11px] text-accent hover:underline font-semibold"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors ${
                      n.read ? 'opacity-60' : 'bg-[var(--accent-soft)] font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[var(--text-main)] font-semibold">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ===================== PORTALED USER PROFILE MENU ===================== */}
      <AnimatePresence>
        {activePopover === 'profile' && (
          <Portal>
            <motion.div
              ref={popoverContentRef}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={profilePosition}
              className="w-64 surface-popover rounded-2xl p-4 text-xs shadow-2xl"
            >
              <div className="pb-3 mb-3 border-b border-[var(--border)] flex items-center gap-3">
                <div className="relative cursor-pointer" onClick={() => setIsProfilePhotoOpen(true)}>
                  <Avatar name={user?.name} src={user?.avatar} size={48} className="ring-2 ring-[var(--accent-soft)]" />
                  <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-accent text-white shadow-lg">
                    <Camera size={12} />
                  </div>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-main)] block">{user?.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)] block truncate">{user?.email}</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white">
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playClick();
                  setActivePopover(null);
                  navigate('/account');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-2 mb-1"
              >
                <User size={14} className="text-[var(--text-muted)]" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setActivePopover(null);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-2 mb-1"
              >
                <SettingsIcon size={14} className="text-[var(--text-muted)]" />
                <span>Workspace Settings</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setActivePopover(null);
                  logout();
                  navigate('/');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors flex items-center gap-2 font-semibold"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ===================== MOBILE BOTTOM NAV BAR (Option 5: Expanding Label) ===================== */}
      <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md z-40 pointer-events-auto">
        <div className="surface-popover/90 dark:bg-[#120D1D]/90 backdrop-blur-2xl border border-[var(--surface-nav-border)] shadow-[0_14px_36px_rgba(0,0,0,0.3)] rounded-full p-1.5 flex items-center justify-between gap-1">
          {[
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Tasks', path: '/tasks', icon: Kanban },
            { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
            ...(user?.role !== 'Employee' ? [{ label: 'Team', path: '/team', icon: Users }] : []),
            { label: 'Chat', path: '/chat', icon: MessageSquare },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/kanban');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => playClick()}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold transition-all duration-300 min-h-[40px] ${
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
                }`}
              >
                {/* Expanding Active Pill Background with Spring Layout Physics */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveDockPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-accent shadow-[0_4px_18px_rgba(var(--accent-rgb,225,29,72),0.45)]"
                  />
                )}

                {/* Subtle halo ripple matching the screenshot's circular ripple */}
                {isActive && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-1 rounded-full border border-accent/40 pointer-events-none"
                  />
                )}

                <span className="relative z-10 flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </span>

                {/* Expanding Label: Active tab grows and label slides out smoothly */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, x: -6 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -6 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="relative z-10 overflow-hidden whitespace-nowrap text-xs font-bold pl-0.5"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Chat status unread dot */}
                {item.label === 'Chat' && !isActive && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[var(--surface-nav)]" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Command Palette Modal (Portaled) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAddTask={() => setIsAddTaskModalOpen(true)}
      />

      {/* Add Task Modal (Portaled) */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />

      {/* Profile Photo Upload Modal (Portaled) */}
      <ProfilePhotoUpload
        isOpen={isProfilePhotoOpen}
        onClose={() => setIsProfilePhotoOpen(false)}
        currentPhotoUrl={user?.profilePhoto?.url}
      />

    </div>
  );
};

export default AppShell;
