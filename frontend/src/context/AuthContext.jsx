import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on page reload if token exists
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreUser();
  }, []);

  // Register passenger
  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const { token, user: registeredUser } = response.data;
    localStorage.setItem('token', token);
    setUser(registeredUser);
    return registeredUser;
  };

  // Login user (passenger or admin)
  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user: loggedInUser } = response.data;
    localStorage.setItem('token', token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
