import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  animate,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  Sparkles, ArrowRight, ChevronRight, Menu, X, Lock,
  MessageSquare, Trophy, Flame, CheckCircle2, Sun, Moon,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import AuroraBackground from '../components/ui/AuroraBackground';
import { useAppearance } from '../context/AppearanceContext';
import { useSound } from '../hooks/useSound';
import { TEAM_MEMBERS } from '../constants/team';

const DISPLAY = { fontFamily: "'Sora', sans-serif" };

const NAV = [
  { label: 'Features', id: 'features' },
  { label: 'AI Engine', id: 'ai-engine' },
  { label: 'Roles', id: 'roles' },
  { label: 'Rewards', id: 'rewards' },
  { label: 'Team', id: 'team' },
];

/* ---------- small helpers ---------- */

const Reveal = ({ children, delay = 0, className = '' }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

const Avatar = ({ m, className = 'w-16 h-16 text-lg' }) => {
  const initials = m.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={`${className} rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center font-bold text-white`}
    >
      {initials}
    </div>
  );
};

const CountUp = ({ to, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, to, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
};

const Tile = ({ title, subtitle, children, className = '' }) => (
  <div
    data-spotlight
    className={`relative p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-card)] dark:border-white/10 backdrop-blur-xl shadow-[var(--surface-card-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-rose-400/50 hover:shadow-[var(--shadow-card-hover)] ${className}`}
  >
    <h3 className="text-lg font-bold text-[var(--text-main)]">{title}</h3>
    <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">{subtitle}</p>
    {children}
  </div>
);

/* ---------- hero preview (presentational, static mock data) ---------- */

const HeroPreview = () => {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);
  const bars = [38, 62, 48, 90, 70, 44, 58];
  const bob = (d) =>
    reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 4 + d, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <div ref={ref} className="relative max-w-5xl mx-auto" style={{ perspective: 1200 }}>
      <motion.div
        style={{ rotateX, scale, transformOrigin: 'center top' }}
        className="rounded-3xl border border-[var(--border-card)] dark:border-white/15 bg-white/90 dark:bg-[#120E1C]/85 backdrop-blur-xl shadow-2xl overflow-hidden text-left text-[var(--text-main)]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-card)] dark:border-white/10">
          <span className="w-3 h-3 rounded-full bg-rose-400/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-teal-400/80" />
          <div className="ml-4 flex-1 max-w-xs h-6 rounded-full bg-black/5 dark:bg-white/10 text-[11px] text-[var(--text-muted)] flex items-center px-3">
            flowzen.app/dashboard
          </div>
        </div>
        <div className="flex">
          <div className="hidden sm:flex w-44 flex-col gap-2 p-4 border-r border-[var(--border-card)] dark:border-white/10">
            {['Dashboard', 'Tasks', 'Calendar', 'Team', 'AI Prioritizer', 'Rewards'].map((n, i) => (
              <div
                key={n}
                className={`px-3 py-2 rounded-xl text-xs transition-colors ${i === 0 ? 'bg-gradient-to-r from-rose-500 to-violet-600 text-white font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                {n}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['Open tasks', '26'], ['Completed', '14'], ['Running', '8'], ['AI alignment', '94%']].map(([l, v], i) => (
                <div
                  key={l}
                  className={`rounded-2xl p-3 ${i === 0 ? 'bg-gradient-to-br from-rose-500 to-violet-600 text-white shadow-md' : 'bg-white/70 dark:bg-white/[0.07] border border-[var(--border-card)] dark:border-white/10'}`}
                >
                  <div className={`text-[11px] ${i === 0 ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{l}</div>
                  <div className="text-2xl font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-5 gap-3 mt-3">
              <div className="sm:col-span-3 rounded-2xl bg-white/70 dark:bg-white/[0.07] border border-[var(--border-card)] dark:border-white/10 p-4">
                <div className="text-xs text-[var(--text-muted)] mb-3">Completed per day</div>
                <div className="flex items-end gap-2 h-24">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-rose-500/80 to-violet-500/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 rounded-2xl bg-white/70 dark:bg-white/[0.07] border border-[var(--border-card)] dark:border-white/10 p-4 space-y-2">
                <div className="text-xs text-[var(--text-muted)]">Ranked by AI score</div>
                {[['API Integration', 94], ['Schema Review', 93], ['Frontend Fixes', 88]].map(([n, s]) => (
                  <div key={n} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text-main)]">{n}</span>
                    <span className="font-bold text-rose-500 dark:text-rose-300">{s}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...bob(0)} className="hidden lg:block absolute -left-6 top-24 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1E1432]/90 border border-[var(--border-card)] dark:border-white/15 backdrop-blur-xl text-sm -rotate-3 shadow-xl text-[var(--text-main)]">
        <b className="text-teal-600 dark:text-teal-300">AI Score 94%</b><br />API Integration
      </motion.div>
      <motion.div {...bob(1)} className="hidden lg:block absolute -right-4 top-40 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1E1432]/90 border border-[var(--border-card)] dark:border-white/15 backdrop-blur-xl text-sm rotate-3 shadow-xl text-[var(--text-main)]">
        <b className="text-amber-500 dark:text-amber-300">+50 XP</b><br />Task complete
      </motion.div>
      <motion.div {...bob(2)} className="hidden lg:block absolute left-16 -bottom-5 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1E1432]/90 border border-[var(--border-card)] dark:border-white/15 backdrop-blur-xl text-sm shadow-xl text-[var(--text-main)]">
        <b className="text-rose-500 dark:text-rose-300">New message</b><br />from Ranu
      </motion.div>
    </div>
  );
};

/* ---------- bento demos ---------- */

const DEMO_TASKS = [
  { id: 1, name: 'API Integration', imp: 9, urg: 8, eff: 4 },
  { id: 2, name: 'Schema Review', imp: 8, urg: 6, eff: 2 },
  { id: 3, name: 'Frontend Fixes', imp: 7, urg: 9, eff: 3 },
  { id: 4, name: 'Docs Update', imp: 4, urg: 3, eff: 2 },
];

const PriorityDemo = () => {
  const [w, setW] = useState({ i: 70, u: 80, e: 35 });
  const ranked = useMemo(() => {
    const den = (w.i + w.u) * 10 || 1;
    return DEMO_TASKS.map((t) => {
      const raw = w.i * t.imp + w.u * t.urg - w.e * t.eff;
      return { ...t, score: Math.max(0, Math.min(100, Math.round((raw / den) * 100))) };
    }).sort((a, b) => b.score - a.score || b.imp - a.imp);
  }, [w]);

  const sliders = [['i', 'Importance'], ['u', 'Urgency'], ['e', 'Effort']];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      <div className="space-y-4">
        {sliders.map(([k, label]) => (
          <label key={k} className="block text-xs text-[var(--text-muted)]">
            <span className="flex justify-between mb-1 text-[var(--text-main)] font-medium">
              {label}
              <b className="text-rose-500 dark:text-rose-300">{w[k]}</b>
            </span>
            <input
              type="range" min="0" max="100" value={w[k]}
              onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })}
              className="w-full cursor-pointer" style={{ accentColor: 'var(--brand-solid, #C2456F)' }}
              aria-label={`${label} weight`}
            />
          </label>
        ))}
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          Priority = wI x Importance + wU x Urgency - wE x Effort
        </p>
      </div>
      <div className="space-y-2">
        {ranked.map((t, idx) => (
          <motion.div
            layout key={t.id}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="flex items-center justify-between rounded-xl bg-white/80 dark:bg-white/[0.07] border border-[var(--border-card)] dark:border-white/10 px-3 py-2.5 text-sm text-[var(--text-main)] shadow-xs"
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/10 dark:bg-white/10 text-rose-600 dark:text-rose-200 text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="font-medium">{t.name}</span>
            </span>
            <b className="text-rose-500 dark:text-rose-300">{t.score}%</b>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const COLS = ['Backlog', 'In Progress', 'Done'];
const KanbanDemo = () => {
  const [cards, setCards] = useState([
    { id: 1, name: 'Design login', col: 0 },
    { id: 2, name: 'Auth guards', col: 1 },
    { id: 3, name: 'Seed data', col: 2 },
    { id: 4, name: 'Chat page', col: 0 },
  ]);
  const move = (id) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col: (c.col + 1) % COLS.length } : c)));
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {COLS.map((c, ci) => (
          <div key={c} className="rounded-2xl bg-[var(--kanban-column-bg)] border border-[var(--kanban-column-border)] p-2 min-h-[150px]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 px-1">{c}</div>
            <div className="space-y-2">
              {cards.filter((x) => x.col === ci).map((x) => (
                <motion.button
                  layout key={x.id} onClick={() => move(x.id)}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="w-full text-left rounded-xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 dark:from-rose-500/30 dark:to-violet-500/30 border border-rose-400/30 dark:border-white/15 px-2.5 py-2 text-xs min-h-11 font-medium text-[var(--text-main)] shadow-xs hover:border-rose-400/60 transition-colors"
                >
                  {x.name}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-3">Tap a card to move it to the next stage.</p>
    </div>
  );
};

const AssignDemo = () => {
  const people = [
    { name: 'Team Member 1', role: 'Employee', avatar: '' },
    { name: 'Team Member 2', role: 'Employee', avatar: '' },
    { name: 'Team Member 3', role: 'Employee', avatar: '' },
    { name: 'Team Member 4', role: 'Employee', avatar: '' },
  ];
  const [sel, setSel] = useState([]);
  const toggle = (n) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const hint =
    sel.length === 0 ? 'Pick who gets this task.'
      : sel.length === 1 ? 'Private task. No discussion thread.'
        : 'A shared discussion thread is created for these people.';
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {people.map((p) => {
          const on = sel.includes(p.name);
          return (
            <button
              key={p.name} onClick={() => toggle(p.name)} aria-pressed={on}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs border transition-all min-h-11 cursor-pointer ${
                on
                  ? 'bg-gradient-to-r from-rose-500 to-violet-600 text-white border-transparent shadow-sm'
                  : 'bg-white/70 dark:bg-white/[0.06] border-[var(--border-card)] dark:border-white/15 text-[var(--text-main)] hover:border-rose-400/50'
              }`}
            >
              <Avatar m={p} className="w-5 h-5 text-[9px]" />
              <span className="font-medium">{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-4 flex items-center gap-2">
        <MessageSquare size={14} className="text-rose-500 dark:text-rose-300" /> {hint}
      </p>
    </div>
  );
};

const RewardsDemo = () => {
  const [xp, setXp] = useState(1850);
  const max = 2500;
  const pct = Math.min(100, Math.round((xp / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-medium">
        <span className="flex items-center gap-1.5"><Flame size={14} className="text-amber-500 dark:text-amber-300" /> 15 day streak</span>
        <span>{xp} / {max} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-violet-500" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setXp((v) => Math.min(max, v + 50))}
          className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-violet-600 text-white min-h-11 flex items-center gap-1.5 shadow-sm cursor-pointer hover:shadow-rose-glow transition-all"
        >
          <CheckCircle2 size={14} /> Complete task +50 XP
        </button>
        {xp >= max && <span className="text-xs text-amber-500 dark:text-amber-300 flex items-center gap-1 font-semibold"><Trophy size={14} /> Elite unlocked</span>}
      </div>
    </div>
  );
};

const ChatTile = () => (
  <div className="space-y-2 text-sm">
    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/80 dark:bg-white/[0.08] border border-[var(--border-card)] dark:border-transparent px-3 py-2 text-[var(--text-main)] shadow-2xs">Got it. Working on the UI fixes.</div>
    <div className="max-w-[80%] ml-auto rounded-2xl rounded-tr-sm bg-gradient-to-r from-rose-500 to-violet-600 px-3 py-2 text-white shadow-sm">Great, ship it!</div>
    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/80 dark:bg-white/[0.08] border border-[var(--border-card)] dark:border-transparent px-3 py-2 text-[var(--text-muted)] shadow-2xs">Query for manager: which task first?</div>
  </div>
);

const IsolationTile = () => (
  <div className="grid grid-cols-2 gap-3">
    {['Company A', 'Company B'].map((c) => (
      <div key={c} className="rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-[var(--border-card)] dark:border-white/10 p-3 text-center shadow-2xs">
        <Lock size={16} className="mx-auto text-teal-600 dark:text-teal-300 mb-1.5" />
        <div className="text-xs font-semibold text-[var(--text-main)]">{c}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Own users, tasks, chats</div>
      </div>
    ))}
  </div>
);

/* ---------- page ---------- */

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useAppearance();
  const { playToggle } = useSound();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleToggleTheme = () => {
    toggleTheme();
    try {
      playToggle(!isDark);
    } catch (e) {}
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (e, id) => {
    e.preventDefault();
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const glassNav = scrolled || mobileOpen;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300 overflow-x-hidden relative">
      {/* aurora stays fixed behind every section */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <AuroraBackground />
      </div>

      {/* blur strip so scrolled content never peeks above the navbar */}
      <div
        className="fixed top-0 inset-x-0 h-24 z-30 pointer-events-none bg-[var(--bg-page)]/80 backdrop-blur-xl transition-colors duration-300"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
          maskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
        }}
      />

      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[min(1100px,92vw)] border transition-all duration-300 ${
          mobileOpen ? 'rounded-3xl' : 'rounded-full'
        } ${
          glassNav
            ? 'bg-white/90 dark:bg-[#140E20]/85 backdrop-blur-xl border-[var(--border-card)] dark:border-white/20 shadow-[0_8px_30px_rgba(180,100,125,0.12)] dark:shadow-none'
            : 'bg-white/75 dark:bg-[#140E20]/60 backdrop-blur-lg border-[var(--border-card)] dark:border-white/10 shadow-[0_4px_24px_rgba(180,100,125,0.06)] dark:shadow-none'
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 gap-2">
          <button className="cursor-pointer shrink-0" onClick={() => navigate('/')} aria-label="FlowZen home">
            <BrandLogo size="sm" showText />
          </button>
          <div className="hidden md:flex items-center md:gap-3.5 lg:gap-6 text-xs lg:text-sm text-[var(--text-muted)]">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => go(e, n.id)}
                className="hover:text-[var(--text-main)] transition-colors font-medium whitespace-nowrap"
              >
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2 sm:p-2.5 rounded-full border border-[var(--border-card)] dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/15 text-[var(--text-main)] transition-all min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun size={16} className="text-amber-300 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={16} className="text-violet-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            <button
              onClick={() => navigate('/auth?mode=login')}
              className="hidden lg:block px-4 py-2 rounded-full text-xs lg:text-sm font-semibold text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-all min-h-10 cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="px-4 sm:px-5 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-violet-600 text-white shadow-lg hover:shadow-rose-glow transition-all flex items-center gap-1.5 min-h-10 sm:min-h-11 cursor-pointer whitespace-nowrap"
              data-magnetic
            >
              Get Started <ArrowRight size={14} />
            </button>
            <button
              className="md:hidden p-2 min-h-10 min-w-10 text-[var(--text-main)] cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-5 pb-4 flex flex-col gap-1 border-t border-[var(--border-card)] dark:border-white/10 pt-2">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => go(e, n.id)}
                className="py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium"
              >
                {n.label}
              </a>
            ))}
            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-card)] dark:border-white/10">
              <span className="text-xs text-[var(--text-muted)]">Theme mode</span>
              <button
                onClick={handleToggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-card)] dark:border-white/15 bg-white/70 dark:bg-white/5 text-xs text-[var(--text-main)] font-semibold cursor-pointer"
              >
                {isDark ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-violet-600" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="py-2.5 text-left text-sm font-semibold text-rose-500 dark:text-rose-300"
            >
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* hero */}
      <section id="top" className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 dark:bg-white/10 border border-rose-400/25 dark:border-white/15 text-xs font-semibold text-rose-600 dark:text-rose-200 mb-6 backdrop-blur-md">
          <Sparkles size={13} className="text-rose-500 dark:text-rose-400" />
          <span>AI-powered task prioritization for teams</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.08] mb-6" style={DISPLAY}>
          One workspace.<br />
          <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-teal-400 dark:from-rose-400 dark:via-violet-400 dark:to-teal-300 bg-clip-text text-transparent">
            Total clarity.
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--text-muted)] leading-relaxed mb-10">
          Organize tasks, track sprints, and stay focused. One calm, AI-assisted dashboard built for teams who ship without burnout.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 text-white font-bold shadow-lg hover:shadow-rose-glow transition-all flex items-center gap-2 min-h-11 cursor-pointer"
            data-magnetic
          >
            Explore Live Dashboard <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/auth?mode=register')}
            className="px-6 py-3 rounded-full bg-white/80 dark:bg-white/10 border border-[var(--border-card)] dark:border-white/20 text-[var(--text-main)] font-bold backdrop-blur-md hover:bg-white/95 dark:hover:bg-white/15 shadow-sm transition-all min-h-11 cursor-pointer"
            data-magnetic
          >
            Register Company
          </button>
        </div>
        <HeroPreview />
      </section>

      {/* product facts */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            [3, '', 'Roles: Admin, Manager, Employee'],
            [4, '', 'Workflow stages on the board'],
            [100, '%', 'Company-isolated data'],
            [50, ' XP', 'For every focus session'],
          ].map(([v, s, l]) => (
            <Reveal key={l} className="text-center">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-rose-500 to-violet-500 dark:from-rose-400 dark:to-violet-400 bg-clip-text text-transparent" style={DISPLAY}>
                <CountUp to={v} suffix={s} />
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* features: bento with live demos */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-16 scroll-mt-28">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-3 text-[var(--text-main)]" style={DISPLAY}>
            Everything in one calm workspace
          </h2>
          <p className="text-center text-[var(--text-muted)] mb-10">Try the demos. They run right here.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Reveal className="md:col-span-3">
            <div id="ai-engine" className="scroll-mt-28 h-full">
              <Tile title="AI Priority Scorer" subtitle="Move the sliders. Tasks re-rank live." className="h-full">
                <PriorityDemo />
              </Tile>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.05}>
            <Tile title="Kanban Board" subtitle="Backlog to Done in one tap." className="h-full">
              <KanbanDemo />
            </Tile>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.05}>
            <Tile title="Multi-assign" subtitle="One person, many people, or a whole team." className="h-full">
              <AssignDemo />
            </Tile>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.1}>
            <div id="rewards" className="scroll-mt-28 h-full">
              <Tile title="Rewards" subtitle="XP, streaks and badges for finished work." className="h-full">
                <RewardsDemo />
              </Tile>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.05}>
            <Tile title="Chat and Queries" subtitle="Shared threads for group tasks, direct line to your manager." className="h-full">
              <ChatTile />
            </Tile>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.1}>
            <Tile title="Company Data Isolation" subtitle="Every company sees only its own workspace." className="h-full">
              <IsolationTile />
            </Tile>
          </Reveal>
        </div>
      </section>

      {/* how it works */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <Reveal><h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-12 text-[var(--text-main)]" style={DISPLAY}>How it works</h2></Reveal>
        <div className="relative">
          <motion.div
            className="hidden md:block absolute top-4 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-rose-500 via-violet-500 to-teal-400 dark:from-rose-400 dark:via-violet-400 dark:to-teal-300 origin-left"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.1, ease: 'easeOut' }}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Register company', 'Admin adds managers', 'Managers add employees', 'Assign, prioritize, reward'].map((s, i) => (
              <Reveal key={s} delay={i * 0.08}>
                <div className="relative p-5 pt-8 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-card)] dark:border-white/10 text-center backdrop-blur-xl shadow-[var(--surface-card-shadow)] text-[var(--text-main)]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 flex items-center justify-center text-sm font-bold ring-4 ring-[var(--bg-page)] text-white shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm font-semibold">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* roles */}
      <section id="roles" className="relative z-10 max-w-6xl mx-auto px-6 py-16 scroll-mt-28">
        <Reveal><h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-10 text-[var(--text-main)]" style={DISPLAY}>Built for every role</h2></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: 'Admin', desc: 'Registers the company, adds managers, sees everything in the workspace.' },
            { role: 'Manager', desc: 'Adds employees, assigns tasks to people or teams, answers their queries.' },
            { role: 'Employee', desc: 'Works on assigned tasks, chats with the manager, earns XP and badges.' },
          ].map((r, i) => (
            <Reveal key={r.role} delay={i * 0.06}>
              <div data-spotlight className="h-full p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-card)] dark:border-white/10 backdrop-blur-xl shadow-[var(--surface-card-shadow)] transition-all hover:-translate-y-1 hover:border-rose-400/50 hover:shadow-[var(--shadow-card-hover)] text-[var(--text-main)]">
                <h3 className="text-xl font-bold mb-2">{r.role}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <Reveal><h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-10 text-[var(--text-main)]" style={DISPLAY}>FAQ</h2></Reveal>
        <div className="space-y-3">
          {[
            { q: 'How does AI prioritization work?', a: 'FlowZen scores tasks with Priority = wI x Importance + wU x Urgency - wE x Effort. You control the weights.' },
            { q: 'Can managers see other teams?', a: 'No. Every company is isolated, and managers only see their own employees.' },
            { q: 'Is there a mobile app?', a: 'The web app is fully responsive and works on phones and tablets.' },
            { q: 'How do rewards work?', a: 'Finished and approved tasks earn XP. Build streaks and unlock badges.' },
          ].map((f, i) => (
            <div key={f.q} className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] dark:border-white/10 overflow-hidden backdrop-blur-xl shadow-[var(--surface-card-shadow)] text-[var(--text-main)]">
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                aria-expanded={openFaq === i}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold min-h-11 cursor-pointer"
              >
                <span>{f.q}</span>
                <ChevronRight size={16} className={`transition-transform duration-200 text-[var(--text-muted)] ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* team */}
      <section id="team" className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-4 text-center scroll-mt-28">
        <Reveal><h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-[var(--text-main)]" style={DISPLAY}>Built by Team Web Wizards</h2></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {TEAM_MEMBERS.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.06}>
              <div data-spotlight className="p-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-card)] dark:border-white/10 backdrop-blur-xl shadow-[var(--surface-card-shadow)] transition-all hover:-translate-y-1 hover:border-rose-400/50 hover:ring-2 hover:ring-rose-400/30 text-[var(--text-main)]">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-[var(--border-card)] dark:border-white/20 overflow-hidden shadow-sm">
                  <Avatar m={m} className="w-full h-full text-lg" />
                </div>
                <h3 className="font-bold text-[var(--text-main)]">{m.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{m.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
        <Reveal>
          <h2 className="text-4xl font-extrabold mb-8 text-[var(--text-main)]" style={DISPLAY}>Ready to find your flow?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-rose-500 to-violet-600 text-white font-bold shadow-lg hover:shadow-rose-glow transition-all min-h-11 cursor-pointer"
              data-magnetic
            >
              Register Company
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full bg-white/80 dark:bg-white/10 border border-[var(--border-card)] dark:border-white/20 text-[var(--text-main)] font-bold backdrop-blur-md hover:bg-white/95 dark:hover:bg-white/15 shadow-sm transition-all min-h-11 cursor-pointer"
              data-magnetic
            >
              Login
            </button>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
        <p>© 2026 FlowZen. AI-Assisted Team Task Management.</p>
        <div className="flex items-center gap-4">
          <span className="opacity-60">Production build</span>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--text-muted)] hover:text-[var(--text-main)] underline transition-colors min-h-11 cursor-pointer">
            Enter Workspace
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
