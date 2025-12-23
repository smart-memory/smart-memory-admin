/**
 * Superadmin Authentication Context
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { errorTracker } from '@/lib/errorTracking';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await api.getCurrentUser();
      
      // Verify superadmin role
      if (!userData.roles?.includes('superadmin')) {
        api.setToken(null);
        setError('Superadmin access required');
        setLoading(false);
        return;
      }
      
      setUser(userData);
      errorTracker.setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      setError(null);
      const userData = await api.login(email, password);
      
      // Verify superadmin role
      if (!userData.roles?.includes('superadmin')) {
        api.setToken(null);
        localStorage.removeItem('admin_refresh_token');
        throw new Error('Superadmin access required');
      }
      
      setUser(userData);
      errorTracker.setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      errorTracker.setUser(null);
    }
  }

  const value = {
    user,
    loading,
    error,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperadmin: user?.roles?.includes('superadmin'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
