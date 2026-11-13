import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare, Send, Hash, Users, Paperclip, Smile,
  AlertCircle, RotateCcw, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useSound } from '../hooks/useSound';
import apiClient, { USE_MOCK } from '../api/client';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const POLL_MS = 5000;

const fmtTime = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const otherParticipant = (conv, myId) =>
  (conv?.participants || []).find((p) => String(p.id) !== String(myId)) || null;

const convTitle = (conv, myId, user) => {
  if (!conv) return '';
  if (conv.type === 'general') return 'general';
  if (conv.type === 'task') return conv.taskId?.title || 'Task discussion';
  const other = otherParticipant(conv, myId);
  return other?.name || 'Direct message';
};

export const ChatPage = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { playClick, playNotification } = useSound();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [messageable, setMessageable] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastTsRef = useRef(null);
  const bootedRef = useRef(false);
  const convsLoadedRef = useRef(false);

  const myId = user?.id;

  // ---------- data loading ----------

  const fetchConversations = useCallback(async () => {
    if (USE_MOCK || !myId) return;
    try {
      const res = await apiClient.get('/conversations');
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
        convsLoadedRef.current = true;
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err?.response?.status || err.message);
      // Only surface on first load — poll failures are transient and the
      // next tick retries; don't spam the error banner.
      if (!convsLoadedRef.current) {
        setError(err?.response?.data?.message || 'Could not load conversations. Check your connection.');
      }
    }
  }, [myId]);

  const fetchMessageable = useCallback(async () => {
    if (USE_MOCK || !myId) return;
    try {
      const res = await apiClient.get('/users/messageable');
      if (res.data?.success) setMessageable(res.data.users || []);
    } catch (err) {
      console.warn('Failed to load messageable users:', err?.response?.status || err.message);
      if (!convsLoadedRef.current) {
        setError(err?.response?.data?.message || 'Could not load chat contacts. Check your connection.');
      }
    }
  }, [myId]);

  const fetchMessages = useCallback(async (convId, { initial = false } = {}) => {
    if (!convId) return;
    try {
      const after = !initial && lastTsRef.current ? `?after=${encodeURIComponent(lastTsRef.current)}` : '';
      const res = await apiClient.get(`/conversations/${convId}/messages${after}`);
      if (res.data?.success && Array.isArray(res.data.messages)) {
        const mapped = res.data.messages.map((m) => ({
          id: m._id,
          senderId: m.senderId?._id || m.senderId,
          sender: m.senderId?.name || 'Unknown',
          role: m.senderId?.role || '',
          time: fmtTime(m.createdAt),
          createdAt: m.createdAt,
          text: m.message,
          pending: false,
          failed: false,
          isMe: String(m.senderId?._id || m.senderId) === String(myId),
        }));
        if (initial) {
          setMessages(mapped);
        } else if (mapped.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...mapped.filter((m) => !seen.has(m.id))];
          });
        }
        const last = mapped[mapped.length - 1];
        if (last?.createdAt) lastTsRef.current = last.createdAt;
      }
    } catch (err) {
      console.warn('Failed to load messages:', err?.response?.status || err.message);
      if (initial) {
        setError(err?.response?.data?.message || 'Could not load messages. Check your connection.');
      }
    }
  }, [myId]);

  // ---------- boot ----------

  useEffect(() => {
    if (USE_MOCK || !myId) return;
    fetchConversations();
    fetchMessageable();
    const iv = setInterval(fetchConversations, 15000);
    return () => clearInterval(iv);
  }, [myId, fetchConversations, fetchMessageable]);

  // Deep links: ?task=<id> | ?dm=<userId> | ?general=1
  useEffect(() => {
    if (bootedRef.current || USE_MOCK || !myId) return;
    bootedRef.current = true;
    const taskId = searchParams.get('task');
    const dmId = searchParams.get('dm');
    const wantGeneral = searchParams.get('general') === '1';
    if (taskId) openTaskThread(taskId);
    else if (dmId) openDm(dmId);
    else if (wantGeneral) openGeneral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, conversations.length]);

  // Poll messages for the active conversation
  useEffect(() => {
    if (!activeConv?.id) return undefined;
    fetchMessages(activeConv.id, { initial: true });
    const iv = setInterval(() => fetchMessages(activeConv.id), POLL_MS);
    return () => clearInterval(iv);
  }, [activeConv?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ---------- conversation openers ----------

  const openConversation = async (conv) => {
    playClick();
    setActiveConv(conv);
    setMessages([]);
    lastTsRef.current = null;
    setLoadingConv(true);
    try {
      await fetchMessages(conv.id, { initial: true });
      await apiClient.post(`/conversations/${conv.id}/read`).catch(() => {});
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)));
    } finally {
      setLoadingConv(false);
    }
  };

  const getOrCreate = async (body) => {
    const res = await apiClient.post('/conversations', body);
    if (!res.data?.success || !res.data?.conversation) throw new Error(res.data?.message || 'Could not open conversation');
    const conv = res.data.conversation;
    setConversations((prev) => {
      const i = prev.findIndex((c) => c.id === conv.id);
      if (i >= 0) { const next = [...prev]; next[i] = conv; return next; }
      return [conv, ...prev];
    });
    return conv;
  };

  const openTaskThread = async (taskId) => {
    setError(null);
    try {
      const conv = await getOrCreate({ taskId });
      openConversation(conv);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  const openDm = async (userId) => {
    setError(null);
    try {
      const conv = await getOrCreate({ userId });
      openConversation(conv);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  const openGeneral = async () => {
    setError(null);
    try {
      const res = await apiClient.post('/conversations', { type: 'general' });
      const conv = res.data?.conversation;
      if (conv) {
        setConversations((prev) => {
          const i = prev.findIndex((c) => c.id === conv.id);
          if (i >= 0) { const next = [...prev]; next[i] = conv; return next; }
          return [conv, ...prev];
        });
        openConversation(conv);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  // ---------- derived lists ----------

  const generalConv = conversations.find((c) => c.type === 'general');
  const dmConvs = conversations.filter((c) => c.type === 'dm');
  const taskConvs = conversations.filter((c) => c.type === 'task');

  // Task threads: prefer existing conversations; also surface assigned tasks
  // that don't have a thread yet (created on click, 1+ assignee).
  const taskThreadItems = useMemo(() => {
    const byTask = new Map(taskConvs.map((c) => [String(c.taskId?._id || c.taskId), c]));
    const items = [];
    for (const c of taskConvs) {
      items.push({ key: c.id, conv: c, task: tasks.find((t) => String(t.id) === String(c.taskId?._id || c.taskId)) });
    }
    for (const t of tasks) {
      const tid = String(t.id);
      if ((t.assignees?.length || 0) >= 1 && !byTask.has(tid)) {
        items.push({ key: `new-${tid}`, conv: null, task: t });
      }
    }
    return items;
  }, [taskConvs, tasks]);

  // DM targets: existing conversations + messageable users not yet covered
  const dmItems = useMemo(() => {
    const seen = new Set();
    const items = [];
    for (const c of dmConvs) {
      const other = otherParticipant(c, myId);
      if (other) {
        seen.add(String(other.id));
        items.push({ key: c.id, conv: c, user: other });
      }
    }
    for (const u of messageable) {
      if (!seen.has(String(u.id))) items.push({ key: `u-${u.id}`, conv: null, user: u });
    }
    return items;
  }, [dmConvs, messageable, myId]);

  // ---------- sending ----------

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConv?.id || sending) return;
    playClick();
    setInputText('');
    setSending(true);

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId, senderId: myId, sender: user?.name || 'You', role: user?.role || '',
      time: fmtTime(new Date().toISOString()), createdAt: new Date().toISOString(),
      text, pending: true, failed: false, isMe: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await apiClient.post(`/conversations/${activeConv.id}/messages`, { message: text });
      const doc = res.data?.message;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? {
        id: doc?._id || tempId,
        senderId: doc?.senderId?._id || myId,
        sender: doc?.senderId?.name || user?.name || 'You',
        role: doc?.senderId?.role || user?.role || '',
        time: fmtTime(doc?.createdAt || new Date().toISOString()),
        createdAt: doc?.createdAt || new Date().toISOString(),
        text: doc?.message || text,
        pending: false, failed: false, isMe: true,
      } : m)));
      if (doc?.createdAt) lastTsRef.current = doc.createdAt;
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      const message = err?.response?.data?.message || 'Message failed to send';
      toast.error(message);
      playNotification?.();
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (msg) => {
    if (!activeConv?.id) return;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, pending: true, failed: false } : m)));
    try {
      const res = await apiClient.post(`/conversations/${activeConv.id}/messages`, { message: msg.text });
      const doc = res.data?.message;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, id: doc?._id || m.id, pending: false, failed: false } : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, pending: false, failed: true } : m)));
      toast.error(err?.response?.data?.message || 'Message failed to send');
    }
  };

  // ---------- render ----------

  if (USE_MOCK) {
    return (
      <div className="card-base p-10 text-center">
        <EmptyState icon={MessageSquare} title="Chat needs the live backend" hint="Chat is only available when connected to the real API (VITE_USE_MOCK=false)." />
      </div>
    );
  }

  const headerTitle = activeConv ? convTitle(activeConv, myId, user) : '';

  return (
    <div className="h-[calc(100dvh-175px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row card-base overflow-hidden">

      {/* ============ LEFT PANEL ============ */}
      <div className="hidden md:flex md:w-60 lg:w-72 border-r border-[var(--border-card)] bg-[var(--bg-card)] flex-col shrink-0">
        <div className="p-4 border-b border-[var(--border-card)]">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Messages</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {/* #general */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-1">Workspace</p>
            <button
              onClick={() => (generalConv ? openConversation(generalConv) : openGeneral())}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeConv?.type === 'general' ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
              }`}
            >
              <span className="flex items-center gap-2"><Hash size={14} /> general</span>
              {(generalConv?.unreadCount || 0) > 0 && activeConv?.type !== 'general' && (
                <span className="text-[10px] font-bold bg-accent text-white rounded-full px-1.5">{generalConv.unreadCount}</span>
              )}
            </button>
          </div>

          {/* Task discussions */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-1">Task discussions</p>
            {taskThreadItems.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] px-3 py-1">Threads appear for tasks with 2+ assignees.</p>
            ) : (
              <div className="space-y-0.5">
                {taskThreadItems.map(({ key, conv, task }) => {
                  const title = task?.title || conv?.taskId?.title || 'Task thread';
                  const active = conv && activeConv?.id === conv.id;
                  const unread = conv?.unreadCount || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => (conv ? openConversation(conv) : openTaskThread(task.id))}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                        active ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ClipboardList size={13} className="shrink-0" />
                        <span className="truncate">{title}</span>
                      </span>
                      {unread > 0 && !active && <span className="text-[10px] font-bold bg-accent text-white rounded-full px-1.5 shrink-0">{unread}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct messages */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-1">Direct messages</p>
            {dmItems.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] px-3 py-1">No one available to message.</p>
            ) : (
              <div className="space-y-0.5">
                {dmItems.map(({ key, conv, user: other }) => {
                  const active = conv && activeConv?.id === conv.id;
                  const unread = conv?.unreadCount || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => (conv ? openConversation(conv) : openDm(other.id))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                        active ? 'bg-accent text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
                      }`}
                    >
                      <Avatar name={other?.name} size={22} />
                      <span className="truncate flex-1">{other?.name || 'Unknown'}</span>
                      <span className="text-[9px] opacity-70">{other?.role}</span>
                      {unread > 0 && !active && <span className="text-[10px] font-bold bg-accent text-white rounded-full px-1.5">{unread}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile conversation switcher */}
      <div className="md:hidden flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-card)] bg-[var(--bg-card)] overflow-x-auto shrink-0">
        <button
          onClick={() => (generalConv ? openConversation(generalConv) : openGeneral())}
          className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap ${activeConv?.type === 'general' ? 'bg-accent text-white' : 'bg-[var(--accent-soft)] text-[var(--text-muted)]'}`}
        >
          <Hash size={12} /> general
        </button>
        {taskThreadItems.slice(0, 4).map(({ key, conv, task }) => (
          <button
            key={key}
            onClick={() => (conv ? openConversation(conv) : openTaskThread(task.id))}
            className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap ${conv && activeConv?.id === conv.id ? 'bg-accent text-white' : 'bg-[var(--accent-soft)] text-[var(--text-muted)]'}`}
          >
            <ClipboardList size={12} /> {(task?.title || conv?.taskId?.title || 'Task').slice(0, 18)}
          </button>
        ))}
        {dmItems.slice(0, 4).map(({ key, conv, user: other }) => (
          <button
            key={key}
            onClick={() => (conv ? openConversation(conv) : openDm(other.id))}
            className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap ${conv && activeConv?.id === conv.id ? 'bg-accent text-white' : 'bg-[var(--accent-soft)] text-[var(--text-muted)]'}`}
          >
            <Avatar name={other?.name} size={16} /> {other?.name?.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ============ MESSAGE PANE ============ */}
      <div className="flex-1 flex flex-col justify-between bg-[var(--bg-page)] min-w-0">

        {/* Header */}
        <div className="h-12 sm:h-14 px-3.5 sm:px-6 border-b border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {activeConv?.type === 'general' ? <Hash size={17} className="text-accent shrink-0" /> : <MessageSquare size={16} className="text-accent shrink-0" />}
            <span className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">{headerTitle || 'Select a conversation'}</span>
            {activeConv?.type === 'task' && activeConv.taskId?._id && (
              <Link
                to={`/tasks`}
                className="hidden sm:inline-flex text-[10px] font-bold text-accent hover:underline shrink-0"
                title="Open task board"
              >
                View task →
              </Link>
            )}
          </div>
          {activeConv?.type === 'task' && activeConv.taskId && (
            <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
              {activeConv.taskId.status}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
          {error && (
            <div className="mx-auto max-w-md p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {!activeConv ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <MessageSquare size={36} className="text-accent/40 mb-2" />
              <p className="text-sm font-bold text-[var(--text-main)]">Pick a conversation</p>
              <p className="text-xs mt-1">Choose #general, a task thread, or message a teammate.</p>
            </div>
          ) : loadingConv && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <MessageSquare size={36} className="text-accent/40 mb-2" />
              <p className="text-sm font-bold text-[var(--text-main)]">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation by sending a message below!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2.5 sm:gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar name={msg.sender} size={30} className="mt-0.5" />
                <div className={`flex-1 max-w-xl ${msg.isMe ? 'flex flex-col items-end' : ''}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-bold text-[var(--text-main)]">{msg.isMe ? 'You' : msg.sender}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{msg.time}</span>
                  </div>
                  <div className={`p-2.5 sm:p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    msg.isMe
                      ? 'bg-accent text-white'
                      : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-main)]'
                  } ${msg.failed ? 'opacity-70' : ''}`}>
                    {msg.text}
                    {msg.pending && <span className="ml-2 text-[10px] opacity-70">sending…</span>}
                    {msg.failed && (
                      <button onClick={() => retryMessage(msg)} className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold underline">
                        <RotateCcw size={10} /> retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-2.5 sm:p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)] flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            placeholder={activeConv ? `Message ${headerTitle}…` : 'Select a conversation first'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!activeConv}
            maxLength={2000}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 min-h-[44px] rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeConv || sending || !inputText.trim()}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[44px] rounded-xl bg-accent text-white font-bold text-xs shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
