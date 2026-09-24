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
  ShieldAlert,
  Menu,
  X,
  User,
  LogOut,
  Cog
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { isMenuAllowed } from '../utils/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { currentUser, logout } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard KPI', icon: LayoutDashboard },
    { id: 'fsr-monitoring', label: 'Monitoring FSR', icon: FileSearch },
    { id: 'fsr-form', label: 'Pengajuan FSR', icon: PlusCircle },
    { id: 'master-data', label: 'Master Data ERP', icon: Database },
    { id: 'activity-logs', label: 'Log Aktivitas', icon: Activity }
  ];

  const allowedItems = menuItems.filter(item => isMenuAllowed(item.id, currentUser));

  return (
    <>
      <aside
        id="app-sidebar"
        className="hidden lg:flex fixed top-0 bottom-0 left-0 z-50 w-64 flex-col border-r border-slate-200 bg-white shadow-xs"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white shadow-xs">
              F
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                FMOS System
              </h1>
              <p className="text-[10px] font-medium text-slate-400">
                ERP Fleet System v1.1.0
              </p>
            </div>
          </div>
        </div>

        {/* Current Active User Profile Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {currentUser.nama}
              </p>
              <div className="inline-flex items-center gap-1 rounded bg-brand-100/50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">
                <ShieldAlert className="h-2 w-2" />
                {currentUser.role_operation}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Handling: <span className="font-semibold text-slate-500">{currentUser.cabang_handling}</span>
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          
          {/* Logout Action */}
          <button
            onClick={() => {
              setShowLogoutConfirm(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-750 transition-colors mt-6 border-t border-dashed border-slate-100 pt-4"
          >
            <LogOut className="h-4.5 w-4.5 text-red-500" />
            Keluar / Logout
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Powered by Supabase</span>
            <span>2026-07-01</span>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog for Sidebar */}
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
