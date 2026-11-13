import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const buildUser = (u, fallbackEmail) => ({
  // Backend login/register return user.id; older payloads may use _id.
  id: u?.id || u?._id || `user-${Date.now()}`,
  name: u?.name || (fallbackEmail ? fallbackEmail.split('@')[0] : 'User'),
  email: u?.email || fallbackEmail || '',
  role: u?.role || 'Employee',
  company: u?.company || u?.companyName || 'FlowZen Studio',
  companyId: u?.companyId || null,
  createdBy: u?.createdBy || null,
  mustChangePassword: !!u?.mustChangePassword,
  avatar: u?.profilePhoto?.url || u?.avatar || null,
  profilePhoto: u?.profilePhoto || { url: null, publicId: null },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('flowzen_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const photoUrl = parsed?.profilePhoto?.url || (parsed?.avatar?.includes?.('images.unsplash.com/photo-1507003211169-0a1dd7228f2d') ? null : parsed?.avatar) || null;
        return { ...parsed, avatar: photoUrl, profilePhoto: parsed?.profilePhoto || { url: photoUrl, publicId: null } };
      } catch (e) { return null; }
    }
    return null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('flowzen_theme') || 'flowzen-light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flowzen_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'flowzen-light' ? 'flowzen-dark' : 'flowzen-light'));
  };

  const persistSession = (userData, token) => {
    setUser(userData);
    localStorage.setItem('flowzen_user', JSON.stringify(userData));
    if (token) localStorage.setItem('flowzen_token', token);
  };

  // Returns { success, user } or { success:false, error }
  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const data = res.data || {};
      if (data.token && data.user) {
        const userData = buildUser(data.user, email);
        persistSession(userData, data.token);
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: userData };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (err) {
      const message = err?.response?.data?.message;
      return { success: false, error: message || 'Unable to connect to FlowZen server. Please ensure the backend is running on port 5000.' };
    }
  };

  // Real backend endpoint: POST /api/auth/register-company
  // Creates Company + Admin account in MongoDB Atlas and returns JWT token
  const registerCompany = async (companyData) => {
    const { companyName, adminName, email, password } = companyData;
    try {
      const res = await apiClient.post('/auth/register-company', {
        companyName,
        adminName,
        email,
        password,
      });
      if (res.data?.success && res.data?.token) {
        const userData = buildUser(res.data.user, email);
        if (res.data.company?.name) userData.company = res.data.company.name;
        persistSession(userData, res.data.token);
        toast.success(`Company "${companyName}" registered! Logged in as Admin.`);
        return { success: true, user: userData };
      }
      return { success: false, error: res.data?.message || 'Registration failed' };
    } catch (err) {
      const message = err?.response?.data?.message;
      return { success: false, error: message || 'Unable to connect to FlowZen server. Please ensure the backend is running.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flowzen_user');
    localStorage.removeItem('flowzen_token');
    toast('Logged out from FlowZen', { icon: '👋' });
  };

  // Update user state (used for profile photo updates)
  const updateUser = (updatedUser) => {
    const photoWasUpdated = Object.prototype.hasOwnProperty.call(updatedUser || {}, 'profilePhoto');
    const nextUser = {
      ...user,
      ...updatedUser,
      avatar: photoWasUpdated
        ? updatedUser.profilePhoto?.url || null
        : updatedUser?.avatar ?? user?.profilePhoto?.url ?? user?.avatar ?? null,
    };
    setUser(nextUser);
    localStorage.setItem('flowzen_user', JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        theme,
        toggleTheme,
        login,
        registerCompany,
        logout,
        setUser: updateUser,
        isAdmin: user?.role === 'Admin',
        isManager: user?.role === 'Manager' || user?.role === 'Admin',
        isEmployee: user?.role === 'Employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
