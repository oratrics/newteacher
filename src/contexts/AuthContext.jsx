// contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      const storedToken = localStorage.getItem('teacherToken');
      const storedUser = localStorage.getItem('teacherUser');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        verifyToken(storedToken, userData);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token, userData) => {
    try {
      // You can add a token verification endpoint here
      // For now, we'll assume the token is valid if it exists
      console.log('Token verified for user:', userData.name);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await authAPI.login({ email, password });
      
      if (response.token) {
        const userData = {
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
          avatar: response.avatar,
          timezone: response.timezone,
          isDemoTeacher: response.isDemoTeacher,
          uniqueId: response.uniqueId
        };

        // Store in localStorage
        localStorage.setItem('teacherToken', response.token);
        localStorage.setItem('teacherUser', JSON.stringify(userData));

        // Update state
        setToken(response.token);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherUser');
    
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('teacherUser', JSON.stringify(updatedUser));
  };

  // Check if token is expired (implement based on your JWT structure)
  const isTokenExpired = (token) => {
    try {
      if (!token) return true;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Auto logout when token expires
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    isTokenExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
