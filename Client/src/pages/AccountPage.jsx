import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../hooks/useSound';
import apiClient from '../api/client';
import Avatar from '../components/ui/Avatar';
import ProfilePhotoUpload from '../components/ui/ProfilePhotoUpload';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all';

export const AccountPage = () => {
  const { user, setUser } = useAuth();
  const { playClick, playSuccess } = useSound();

  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const mustChange = !!user?.mustChangePassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwLoading) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from the current one');
      return;
    }

    setPwLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        playSuccess();
        toast.success(res.data.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (mustChange && setUser) {
          setUser({ ...user, mustChangePassword: false });
        }
      } else {
        toast.error(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Your personal profile, photo and password. Workspace preferences live under Settings.
        </p>
      </div>

      {mustChange && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block">Temporary password in use</span>
            <span>
              You signed in with a temporary password. Please set a new permanent password below.
            </span>
          </div>
        </div>
      )}

      {/* ===================== PROFILE ===================== */}
      <div className="card-base p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
          <User size={18} className="text-accent" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Profile</h2>
            <p className="text-xs text-[var(--text-muted)]">Your identity across this workspace</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <button
            onClick={() => {
              playClick();
              setIsPhotoOpen(true);
            }}
            className="relative group shrink-0 cursor-pointer"
            title="Change profile photo"
          >
            <Avatar name={user?.name} src={user?.avatar || user?.profilePhoto?.url} size={88} className="ring-4 ring-[var(--accent-soft)]" />
            <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-accent text-white shadow-lg group-hover:scale-110 transition-transform">
              <Camera size={14} />
            </span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full text-xs">
            <div className="p-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)]">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <User size={12} /> Name
              </span>
              <span className="font-bold text-[var(--text-main)] text-sm">{user?.name}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)]">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <Mail size={12} /> Email
              </span>
              <span className="font-bold text-[var(--text-main)] text-sm break-all">{user?.email}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)]">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <ShieldCheck size={12} /> Role
              </span>
              <span className="font-bold text-accent text-sm">{user?.role}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-page)]">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <Building2 size={12} /> Organization
              </span>
              <span className="font-bold text-[var(--text-main)] text-sm">{user?.company || 'FlowZen Studio'}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)]">
          Click your photo to upload a new one. Supported: JPG, PNG, WEBP up to 5 MB.
        </p>
      </div>

      {/* ===================== CHANGE PASSWORD ===================== */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-card)]">
          <KeyRound size={18} className="text-accent" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Change Password</h2>
            <p className="text-xs text-[var(--text-muted)]">Use your current password to set a new one</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputCls} pr-10`}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="Repeat new password"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {pwLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            <span>{pwLoading ? 'Updating…' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      <ProfilePhotoUpload
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        currentPhotoUrl={user?.profilePhoto?.url || user?.avatar}
      />
    </div>
  );
};

export default AccountPage;
