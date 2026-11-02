import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Hash, 
  Users, 
  Sparkles, 
  Paperclip, 
  Smile, 
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useSound } from '../hooks/useSound';

export const ChatPage = () => {
  const { user } = useAuth();
  const { teamMembers } = useTasks();
  const { playClick, playNotification } = useSound();

  const [activeChannel, setActiveChannel] = useState('general');
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'Gayatri Joshi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      time: '10:42 AM',
      text: 'Good morning team! The Q4 AI priority weights have been calibrated. Check your updated task order.',
      channel: 'general'
    },
    {
      id: 'm-2',
      sender: 'Kiran Deshmukh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      time: '10:45 AM',
      text: 'Verified. API integration and auth guards are 100% complete. Running test suite.',
      channel: 'general'
    },
    {
      id: 'm-3',
      sender: 'FlowZen AI Assistant',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      time: '11:00 AM',
      text: 'Notice: Workload is evenly distributed. Team velocity is currently +18% above the seasonal baseline.',
      channel: 'ai-insights'
    }
  ]);

  const channels = [
    { id: 'general', name: 'general', unread: 0 },
    { id: 'ai-insights', name: 'ai-insights', unread: 1 },
    { id: 'project-sprints', name: 'project-sprints', unread: 0 },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    playClick();

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: user?.name || 'You',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      time: 'Just now',
      text: inputText.trim(),
      channel: activeChannel
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated reply after 1.5 seconds with sound
    setTimeout(() => {
      playNotification();
      setMessages((prev) => [
        ...prev,
        {
          id: `m-reply-${Date.now()}`,
          sender: 'Mansi Patil',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          time: 'Just now',
          text: 'Got it! Working on the responsive UI fixes right now.',
          channel: activeChannel
        }
      ]);
    }, 1500);
  };

  const channelMessages = messages.filter(m => m.channel === activeChannel);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row card-base overflow-hidden">
      
      {/* Channels Sidebar */}
      <div className="w-full lg:w-64 border-r border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0">
        <div className="p-4 border-b border-[var(--border-card)]">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
            Workspace Channels
          </span>
        </div>

        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                playClick();
                setActiveChannel(ch.id);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeChannel === ch.id
                  ? 'bg-accent text-white font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-soft)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Hash size={14} />
                <span>{ch.name}</span>
              </span>
              {ch.unread > 0 && activeChannel !== ch.id && (
                <span className="w-2 h-2 rounded-full bg-accent" />
              )}
            </button>
          ))}

          <div className="pt-4 pb-2 px-1">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Online Colleagues ({teamMembers.length})
            </span>
          </div>

          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[var(--text-muted)]">
              <span className={`w-2 h-2 rounded-full ${m.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="truncate">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages Pane */}
      <div className="flex-1 flex flex-col justify-between bg-[var(--bg-page)]">
        
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash size={18} className="text-accent" />
            <span className="text-sm font-bold text-[var(--text-main)]">{activeChannel}</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Calm team communication channel
          </span>
        </div>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {channelMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <img
                src={msg.avatar}
                alt={msg.sender}
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 max-w-xl">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-[var(--text-main)]">{msg.sender}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{msg.time}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-main)] leading-relaxed shadow-2xs">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)] flex items-center gap-3">
          <input
            type="text"
            placeholder={`Message #${activeChannel}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)] text-xs text-[var(--text-main)] focus:outline-none focus:border-accent"
          />

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
};

export default ChatPage;

