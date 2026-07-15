import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, RegisterRequest, UserUpdate } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UserUpdate) => Promise<User>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
        // Fetch fresh user data
        const freshUser = await authService.getProfile();
        setUser(freshUser);
        authService.setCurrentUser(freshUser);
      }
    } catch {
      authService.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    await authService.login(data);
    await refreshUser();
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
    // Auto-login after registration
    await authService.login({
      email: data.email,
      password: data.password,
    });
    await refreshUser();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: UserUpdate) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
