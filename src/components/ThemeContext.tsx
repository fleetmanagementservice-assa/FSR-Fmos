/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OperationUser, UserRole } from '../types';
import { localDb } from '../db/localDb';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: OperationUser;
  setCurrentUser: (user: OperationUser) => void;
  switchUserRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  login: (user: OperationUser) => void;
  logout: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<'light'>('light');
  const [currentUser, setCurrentUser] = useState<OperationUser>(localDb.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('fsr_is_logged_in') === 'true';
  });

  useEffect(() => {
    // Always enforce light theme at HTML root
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    // No-op to prevent state changes
  };

  const login = (user: OperationUser) => {
    localStorage.setItem('fsr_is_logged_in', 'true');
    localDb.setCurrentUser(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    window.dispatchEvent(new CustomEvent('fsr_db_updated'));
  };

  const logout = () => {
    localStorage.setItem('fsr_is_logged_in', 'false');
    setIsLoggedIn(false);
  };

  const switchUserRole = (role: UserRole) => {
    const users = localDb.getOperationUsers();
    const matched = users.find((u) => u.role_operation === role);
    if (matched) {
      localDb.setCurrentUser(matched);
      setCurrentUser(matched);
    } else {
      // Fallback create mock
      const mockUser: OperationUser = {
        id: `mock-${role.toLowerCase().replace(' ', '')}`,
        nama: `Mock ${role}`,
        username: `mock_${role.toLowerCase().replace(' ', '_')}`,
        role_operation: role,
        cabang_handling: 'DKI Jakarta',
        status: 'Active',
        created_at: new Date().toISOString(),
        created_by: 'system',
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };
      localDb.setCurrentUser(mockUser);
      setCurrentUser(mockUser);
    }
    // Dispatch general event to trigger real-time updates across screens
    window.dispatchEvent(new CustomEvent('fsr_db_updated'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentUser, setCurrentUser, switchUserRole, isLoggedIn, login, logout }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
