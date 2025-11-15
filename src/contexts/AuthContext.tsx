'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        // Check both localStorage and sessionStorage
        const storedToken = localStorage.getItem('vedic_auth_token') || 
                          sessionStorage.getItem('vedic_auth_token');
        const storedUser = localStorage.getItem('vedic_user') || 
                         sessionStorage.getItem('vedic_user');

        if (storedToken && storedUser) {
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: storedToken }),
          });

          if (response.ok) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('vedic_auth_token');
            localStorage.removeItem('vedic_user');
            sessionStorage.removeItem('vedic_auth_token');
            sessionStorage.removeItem('vedic_user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredAuth();
  }, []);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('vedic_auth_token');
    localStorage.removeItem('vedic_user');
    sessionStorage.removeItem('vedic_auth_token');
    sessionStorage.removeItem('vedic_user');

    // Reset state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};