import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('flowzen_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    // Default logged in user for immediate experience
    return {
      id: 'user-4',
      name: 'Kiran Deshmukh',
      email: 'kiran@flowzen.ai',
      role: 'Admin',
      company: 'FlowZen Technologies',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    };
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

  const login = async (email, password, roleOverride = null) => {
    try {
      // Attempt backend API login if available
      const res = await apiClient.post('/auth/login', { email, password }).catch(() => null);
      if (res && res.data && res.data.token) {
        localStorage.setItem('flowzen_token', res.data.token);
        const userData = {
          id: res.data.user?._id || 'user-live',
          name: res.data.user?.name || email.split('@')[0],
          email,
          role: res.data.user?.role || 'Admin',
          company: res.data.user?.company || 'FlowZen Studio',
          avatar: res.data.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
        };
        setUser(userData);
        localStorage.setItem('flowzen_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: userData };
      }
      if (res && res.data && res.status === 404) {
        return { success: false, error: 'Account not found' };
      }
    } catch (err) {
      console.warn('Backend login fallback to standalone mock:', err);
    }

    // Standalone fallback
    const knownEmails = ['kiran@flowzen.ai', 'gayatri@flowzen.ai', 'mansi@flowzen.ai', 'admin@flowzen.ai'];
    if (!knownEmails.includes(email.toLowerCase())) {
      return { success: false, error: 'Account not found' };
    }

    let role = roleOverride;
    let name = 'Team Member';
    if (!role) {
      if (email.includes('admin') || email.includes('kiran')) {
        role = 'Admin';
        name = 'Kiran Deshmukh';
      } else if (email.includes('manager') || email.includes('gayatri')) {
        role = 'Manager';
        name = 'Gayatri Joshi';
      } else {
        role = 'Employee';
        name = 'Mansi Patil';
      }
    } else {
      name = email.split('@')[0] || 'User';
    }

    const mockUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      company: 'FlowZen Workspace',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    };

    setUser(mockUser);
    localStorage.setItem('flowzen_user', JSON.stringify(mockUser));
    localStorage.setItem('flowzen_token', 'mock_jwt_token_flowzen');
    toast.success(`Signed in as ${mockUser.name} (${role})`);
    return { success: true, user: mockUser };
  };

  const registerCompany = async (companyData) => {
    // When a company registers, the creator is designated as Admin
    const { companyName, adminName, email, password } = companyData;
    try {
      const res = await apiClient.post('/auth/register', {
        name: adminName,
        email,
        password,
        role: 'Admin',
        company: companyName
      }).catch(() => null);

      if (res && res.data) {
        if (res.data.token) localStorage.setItem('flowzen_token', res.data.token);
      }
    } catch (e) {
      console.warn('Backend register fallback to mock:', e);
    }

    const newUser = {
      id: `admin-${Date.now()}`,
      name: adminName,
      email,
      role: 'Admin',
      company: companyName,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    };

    setUser(newUser);
    localStorage.setItem('flowzen_user', JSON.stringify(newUser));
    localStorage.setItem('flowzen_token', 'mock_jwt_token_flowzen_admin');
    toast.success(`Company ${companyName} registered! Logged in as Admin.`);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flowzen_user');
    localStorage.removeItem('flowzen_token');
    toast('Logged out from FlowZen', { icon: '👋' });
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('flowzen_user', JSON.stringify(updated));
    toast.success(`Switched role to ${newRole}`);
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
        switchRole,
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

