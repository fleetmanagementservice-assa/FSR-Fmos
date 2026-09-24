/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSearch,
  PlusCircle,
  Database,
  Activity,
  Terminal,
  LogOut
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { isMenuAllowed } from '../utils/permissions';

interface BottomNavProps {
  activeTab: 'dashboard' | 'fsr-form' | 'fsr-monitoring' | 'master-data' | 'activity-logs';
  setActiveTab: (tab: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fsr-monitoring', label: 'Monitoring', icon: FileSearch },
    { id: 'fsr-form', label: 'Pengajuan', icon: PlusCircle },
    { id: 'master-data', label: 'Master Data', icon: Database },
    { id: 'activity-logs', label: 'Log', icon: Activity },
    { id: 'logout', label: 'Keluar', icon: LogOut }
  ];

  const allowedItems = menuItems.filter(item => {
    if (item.id === 'logout') return true;
    return isMenuAllowed(item.id, currentUser);
  });

  // Calculate dynamic grid columns to span evenly
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[allowedItems.length] || 'grid-cols-5';

  return (
    <>
      <nav 
        id="mobile-bottom-nav"
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden grid ${colsClass} bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-250/50 pb-[env(safe-area-inset-bottom,12px)] shadow-lg px-2 pt-1`}
      >
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  setShowLogoutConfirm(true);
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              className="flex flex-col items-center justify-center min-h-[48px] h-14 py-2 px-1 text-center relative focus:outline-none select-none active-press"
            >
              {/* Active Highlight Line */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-brand-500" />
              )}

              <Icon 
                className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${
                  isActive 
                    ? 'text-brand-500 scale-105' 
                    : item.id === 'logout'
                      ? 'text-red-500'
                      : 'text-slate-400'
                }`} 
              />
              
              <span 
                className={`text-[9px] font-bold tracking-tight truncate max-w-full ${
                  isActive 
                    ? 'text-brand-600 font-extrabold' 
                    : item.id === 'logout'
                      ? 'text-red-500 font-bold'
                      : 'text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4 mx-auto dark:bg-red-950/30">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-center text-sm font-extrabold text-slate-900 dark:text-white">
              Konfirmasi Keluar
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Apakah Anda yakin ingin keluar dari aplikasi FMOS System? Sesi Anda akan diakhiri.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 hover:bg-red-750 active:scale-98 transition-all"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
