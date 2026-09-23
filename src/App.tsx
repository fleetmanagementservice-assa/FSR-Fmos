/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { FsrForm } from './components/FsrForm';
import { FsrMonitoring } from './components/FsrMonitoring';
import { MasterData } from './components/MasterData';
import { Login } from './components/Login';
import { supabase, pullSupabaseToLocal, pushLocalToSupabase } from './db/supabaseClient';
import { isMenuAllowed, getStartTabForUser } from './utils/permissions';
import { initRealtimeNotificationListener, requestNotificationPermission, warmupAudioContext } from './utils/browserNotification';

function AppContent() {
  const { isLoggedIn, currentUser } = useTheme();
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'fsr-form' | 'fsr-monitoring' | 'master-data'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(true);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [activeToast, setActiveToast] = React.useState<{ title: string; body: string; fsrId?: string } | null>(null);

  // Warm up AudioContext on first click/tap to unlock mobile/Safari audio autoplay
  React.useEffect(() => {
    const handleGesture = () => {
      warmupAudioContext();
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
    };
    document.addEventListener('click', handleGesture);
    document.addEventListener('touchstart', handleGesture);
    return () => {
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Set up realtime browser notifications subscription
  React.useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // Ask for permission gracefully after delay
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        requestNotificationPermission().catch(() => {});
      }, 5000);
    }

    const unsubscribe = initRealtimeNotificationListener(() => currentUser);

    const handleInAppToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string; fsrId?: string }>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          setActiveToast(current => {
            if (current && current.title === customEvent.detail.title && current.body === customEvent.detail.body) {
              return null;
            }
            return current;
          });
        }, 6000);
      }
    };

    window.addEventListener('in_app_notification_toast', handleInAppToast);

    return () => {
      unsubscribe();
      window.removeEventListener('in_app_notification_toast', handleInAppToast);
    };
  }, [isLoggedIn, currentUser]);

  // Enforce role-based menu access on active tab changes or user login
  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      if (!isMenuAllowed(activeTab, currentUser)) {
        setActiveTab(getStartTabForUser(currentUser));
      }
    }
  }, [isLoggedIn, currentUser, activeTab]);

  React.useEffect(() => {
    async function initializeSupabase() {
      try {
        console.log('[FMOS] Initializing direct Supabase database connections...');
        
        // 1. Check if the database works and operation_users exists
        const { error: testError } = await supabase.from('operation_users').select('id').limit(1);
        if (testError) {
          if (testError.message?.includes('does not exist') || testError.code === 'P0001') {
            throw new Error('Tabel database "operation_users" belum ada di Supabase Anda. Mohon buka "Migration Tool" (di Master Data) lalu salin & jalankan DDL SQL di SQL Editor Supabase Anda.');
          }
          throw testError;
        }

        // 2. Automatically push seeds if operation_users is empty
        const { data: users, error: usersError } = await supabase.from('operation_users').select('id').limit(1);
        if (!usersError && (!users || users.length === 0)) {
          console.log('[FMOS] Supabase detected empty. Automatically seeding default data to Supabase...');
          await pushLocalToSupabase();
        }

        // 3. Pull latest data from Supabase to local storage cache
        const pullRes = await pullSupabaseToLocal();
        if (!pullRes.success) {
          throw new Error(pullRes.message);
        }
        
        console.log('[FMOS] Direct connection & synchronization with Supabase completed successfully!');
        setIsSyncing(false);
      } catch (err: any) {
        console.error('[FMOS] Database sync failed:', err);
        let readableMsg = '';
        if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
          readableMsg = 'Gagal terhubung ke Supabase karena pembatasan jaringan / proxy (Failed to fetch).';
        } else if (err.message && (err.message.includes('operation_users') || err.message.includes('schema cache'))) {
          readableMsg = 'Tabel database "operation_users" belum terkonfigurasi di Supabase Anda.';
        } else {
          readableMsg = err.message || 'Gagal tersambung ke database Supabase.';
        }

        setSyncError(`${readableMsg}\n\nMengalihkan otomatis ke Database Lokal (Offline Mode) dalam 3 detik agar aplikasi tetap berjalan lancar dengan data lokal...`);
        
        // Auto-bypass in 3 seconds for all cases to prevent any white-screens or locks
        setTimeout(() => {
          setIsSyncing(false);
        }, 3000);
      }
    }

    initializeSupabase();
  }, []);

  React.useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setActiveTab(customEvent.detail as any);
      }
    };
    window.addEventListener('switch_tab', handleSwitchTab);
    return () => window.removeEventListener('switch_tab', handleSwitchTab);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Analytics';
      case 'fsr-form':
        return 'Pengajuan Fleet Service Request (FSR)';
      case 'fsr-monitoring':
        return 'Monitoring FSR & Workflow Stepper';
      case 'master-data':
        return 'Master Data Management Hub';
      default:
        return 'FMOS System';
    }
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview';
      case 'fsr-form':
        return 'FSR Module / Submit Form';
      case 'fsr-monitoring':
        return 'FSR Module / Live Monitoring';
      case 'master-data':
        return 'Admin / Master Tables';
      default:
        return 'Home';
    }
  };

  if (isSyncing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="relative flex justify-center mb-6">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
              F
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md border-2 border-white">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-slate-900">FMOS System</h2>
          <p className="text-xs text-slate-400 mt-0.5">Fleet Management & Operation Service</p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-2.5 text-xs font-bold text-slate-500 bg-slate-100/80 rounded-xl py-3 px-4">
              <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </div>

            {syncError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-4 text-left animate-in fade-in duration-200">
                <div className="flex gap-2 text-red-700">
                  <span className="text-xs font-extrabold uppercase">Koneksi Tertunda / Error:</span>
                </div>
                <p className="text-[11px] text-red-600 mt-1.5 leading-relaxed font-medium">
                  {syncError}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 rounded-lg bg-slate-900 py-1.5 text-[10px] font-bold text-white hover:bg-slate-850 active:scale-98 transition-all"
                  >
                    Coba Hubungkan Lagi
                  </button>
                  <button
                    onClick={() => setIsSyncing(false)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all"
                  >
                    Bypass & Masuk Offline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-800 transition-colors duration-200 select-none">
      
      {/* Dynamic Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Application Body */}
      <div className="flex-1 flex flex-col h-full min-w-0 lg:pl-64 overflow-hidden">
        
        {/* Main Top Header Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={getPageTitle()} />

        {/* Core Interactive Workspace Content - Independently Scrollable */}
        <main className="flex-1 p-4 md:p-6 pb-28 lg:pb-8 space-y-6 overflow-y-auto no-scrollbar">
          
          {/* Page Header Section */}
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-brand-600 uppercase">
                {getBreadcrumb()}
              </span>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950 md:text-xl">
                {getPageTitle()}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 md:mt-0 font-medium">
              <span>FSR System</span>
              <span>/</span>
              <span className="text-slate-600 capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          {/* Core screen selection wrapper */}
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && isMenuAllowed('dashboard', currentUser) && <Dashboard />}
            {activeTab === 'fsr-form' && isMenuAllowed('fsr-form', currentUser) && <FsrForm onSuccess={() => setActiveTab('fsr-monitoring')} />}
            {activeTab === 'fsr-monitoring' && isMenuAllowed('fsr-monitoring', currentUser) && <FsrMonitoring />}
            {activeTab === 'master-data' && isMenuAllowed('master-data', currentUser) && <MasterData />}
          </div>

        </main>
      </div>

      {/* Persistent Bottom Tab Navigation for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time In-App Toast Banner */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white dark:bg-gray-950 border-2 border-brand-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-300 flex gap-3.5 items-start">
          <div className="bg-brand-50 dark:bg-brand-950/40 p-2.5 rounded-xl text-brand-600 shrink-0">
            <svg className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {activeToast.title}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-semibold">
              {activeToast.body}
            </p>
            {activeToast.fsrId && (
              <button
                onClick={() => {
                  setActiveTab('fsr-monitoring');
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('fsr_select_detail', { detail: { fsrId: activeToast.fsrId } })
                    );
                  }, 150);
                  setActiveToast(null);
                }}
                className="mt-2.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all block text-center w-full"
              >
                Lihat Detail Pekerjaan &rarr;
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
