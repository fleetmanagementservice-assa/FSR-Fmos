/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  RotateCw,
  ShieldCheck,
  ChevronDown,
  User,
  CheckCircle,
  Inbox,
  X
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { localDb } from '../db/localDb';
import { Notification, UserRole } from '../types';
import { getNotificationPermissionStatus, requestNotificationPermission, sendBrowserNotification } from '../utils/browserNotification';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const { theme, toggleTheme, currentUser, switchUserRole } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Reload notifications on db update or user change
  const fetchNotifications = () => {
    const list = localDb.getNotifications(currentUser);
    setNotifications(list);
  };

  useEffect(() => {
    fetchNotifications();
    const handleDbUpdate = () => fetchNotifications();
    window.addEventListener('fsr_db_updated', handleDbUpdate);
    return () => window.removeEventListener('fsr_db_updated', handleDbUpdate);
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await localDb.markNotificationAsRead(id);
    fetchNotifications();
  };

  const handleRoleChange = (role: UserRole) => {
    switchUserRole(role);
    setShowRoleMenu(false);
  };

  const roleOptions: UserRole[] = [
    'Super Admin',
    'Admin Customer',
    'Leader Customer',
    'SA',
    'SS',
    'VRO',
    'TS',
    'Vendor',
    'Leader Operation'
  ];

  return (
    <header className="sticky top-0 z-30 flex h-20 pt-[env(safe-area-inset-top,12px)] pb-3 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 md:px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase truncate max-w-[180px] sm:max-w-xs">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* REFRESH BUTTON */}
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-gray-200 h-11 w-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 transition-all active-press"
          title="Refresh Data"
        >
          <RotateCw className="h-5 w-5" />
        </button>

        {/* NOTIFICATIONS CENTER */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative rounded-full border border-gray-200 h-11 w-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 transition-all active-press"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <>
              {/* Overlay Backdrop to prevent overlapping with other items and allow easy close */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 sm:bg-transparent"
                onClick={() => setShowNotifMenu(false)}
              />
              <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-88 z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Notifikasi Sistem
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-extrabold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      {unreadCount} Baru
                    </span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] sm:max-h-80 divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                      <Inbox className="h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-xs">Belum ada notifikasi baru</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const hasAction = !!notif.fsr_id;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            // Tandai otomatis sebagai dibaca
                            if (!notif.is_read) {
                              handleMarkAsRead(notif.id);
                            }
                            // Jika memiliki FSR ID, langsung navigasikan ke Monitoring dan buka detailnya
                            if (hasAction && notif.fsr_id) {
                              // Tutup dropdown notifikasi
                              setShowNotifMenu(false);
                              
                              // Navigasi ke tab FSR Monitoring
                              window.dispatchEvent(
                                new CustomEvent('switch_tab', { detail: 'fsr-monitoring' })
                              );
                              
                              // Buka detail pekerjaan FSR secara langsung
                              setTimeout(() => {
                                window.dispatchEvent(
                                  new CustomEvent('fsr_select_detail', { detail: { fsrId: notif.fsr_id } })
                                );
                              }, 100);
                            }
                          }}
                          className={`p-3.5 transition-all text-left block w-full ${
                            hasAction ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60' : ''
                          } ${
                            notif.is_read ? 'bg-white dark:bg-gray-950' : 'bg-blue-50/50 dark:bg-blue-950/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {notif.title}
                            </span>
                            {!notif.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notif.id);
                                }}
                                className="text-[9px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Tandai dibaca
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {notif.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {hasAction && (
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Klik Tinjau Pekerjaan
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {/* Desktop Alert Request Block */}
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Notifikasi Desktop
                    </span>
                    <button
                      onClick={async () => {
                        const res = await requestNotificationPermission();
                        if (res === 'granted') {
                          alert('Notifikasi desktop real-time berhasil diaktifkan!');
                        } else {
                          alert('Notifikasi desktop diblokir atau tidak didukung di peramban ini.');
                        }
                      }}
                      className="text-[10px] bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-2.5 py-1 rounded-md transition-all active:scale-95"
                    >
                      {getNotificationPermissionStatus() === 'granted' ? 'Sudah Aktif 🔔' : 'Aktifkan 🔔'}
                    </button>
                  </div>
                  
                  {/* SIMULATED TEST TRIGGER */}
                  <div className="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-800/60 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Uji Fitur Suara & Toast
                    </span>
                    <button
                      onClick={() => {
                        sendBrowserNotification('Uji Coba Notifikasi FSR', {
                          body: 'Suara chime dan in-app toast sistem ini bekerja dengan sukses 100%!',
                          playSound: true
                        });
                      }}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold px-2.5 py-1 rounded-md transition-all active:scale-95"
                    >
                      Simulasi Tes 🔊
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
