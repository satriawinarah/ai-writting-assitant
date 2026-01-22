/**
 * Custom hook for authentication management.
 *
 * Handles user login, registration, logout, and auth state.
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import useErrorHandler from './useErrorHandler';
import { useNotifications } from '../contexts/NotificationContext';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const { handleError } = useErrorHandler();
  const { showSuccess } = useNotifications();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      showSuccess('Login successful');
    } catch (error) {
      handleError(error, 'Login failed');
      throw error;
    }
  }, [handleError, showSuccess]);

  const register = useCallback(async (userData) => {
    try {
      await authAPI.register(userData);
      showSuccess('Registration successful! Please wait for admin approval to login.');
    } catch (error) {
      handleError(error, 'Registration failed');
      throw error;
    }
  }, [handleError, showSuccess]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't show error for logout failures, still log user out locally
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setShowLanding(true);
    }
  }, [showSuccess]);

  const goToLogin = useCallback(() => {
    setShowLanding(false);
    setShowRegister(false);
  }, []);

  const goToRegister = useCallback(() => {
    setShowRegister(true);
  }, []);

  const goToLanding = useCallback(() => {
    setShowLanding(true);
    setShowRegister(false);
  }, []);

  return {
    // State
    user,
    loading,
    showLanding,
    showRegister,
    isAuthenticated: !!user,

    // Actions
    login,
    register,
    logout,
    goToLogin,
    goToRegister,
    goToLanding,
  };
}
